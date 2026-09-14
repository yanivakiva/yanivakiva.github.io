// macOS-only, deterministic export of the approved YA/ and garden sharing artwork.
// Run: swift scripts/build-brand-assets.swift PATH_TO_SPACE_GROTESK_MEDIUM_TTF
// No network, AI generation, or private source files are used by this exporter.
import Foundation
import CoreGraphics
import CoreText
import ImageIO
import UniformTypeIdentifiers

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let srgb = CGColorSpace(name: CGColorSpace.sRGB)!
func color(_ hex: UInt32, _ alpha: CGFloat = 1) -> CGColor {
    CGColor(colorSpace: srgb, components: [CGFloat((hex >> 16) & 255) / 255, CGFloat((hex >> 8) & 255) / 255, CGFloat(hex & 255) / 255, alpha])!
}
let ink = color(0x11171e), cream = color(0xf7f3e9), orange = color(0xd77c43)
func font(_ path: String, _ size: CGFloat) -> CTFont {
    guard let provider = CGDataProvider(url: root.appendingPathComponent(path) as CFURL), let face = CGFont(provider) else { fatalError("Cannot load font: \(path)") }
    return CTFontCreateWithGraphicsFont(face, size, nil, nil)
}
let boldPath = "public/fonts/SpaceGrotesk-Bold.ttf"
guard CommandLine.arguments.count == 2 else { fatalError("Pass the path to Space Grotesk Medium (500), matching the approved mockup.") }
let mediumPath = CommandLine.arguments[1]
func image(_ path: String) -> CGImage {
    guard let source = CGImageSourceCreateWithURL(root.appendingPathComponent(path) as CFURL, nil), let decoded = CGImageSourceCreateImageAtIndex(source, 0, nil) else { fatalError("Cannot decode: \(path)") }
    return decoded
}
func canvas(_ width: Int, _ height: Int) -> CGContext {
    let ctx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4, space: srgb, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.interpolationQuality = .high
    ctx.setShouldAntialias(true)
    return ctx
}
func png(_ image: CGImage) -> Data {
    let data = NSMutableData()
    let destination = CGImageDestinationCreateWithData(data, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else { fatalError("PNG export failed") }
    return data as Data
}
func save(_ data: Data, _ name: String) throws {
    try data.write(to: root.appendingPathComponent("public/" + name), options: .atomic)
    print("\(name): \(data.count) bytes")
}
func line(_ text: String, _ face: CTFont, _ fill: CGColor, _ tracking: CGFloat = 0) -> CTLine {
    let attributes: [NSAttributedString.Key: Any] = [NSAttributedString.Key(kCTFontAttributeName as String): face, NSAttributedString.Key(kCTForegroundColorAttributeName as String): fill, NSAttributedString.Key(kCTKernAttributeName as String): tracking]
    return CTLineCreateWithAttributedString(NSAttributedString(string: text, attributes: attributes))
}
func drawText(_ ctx: CGContext, _ text: String, x: CGFloat, top: CGFloat, size: CGFloat, lineHeight: CGFloat, weight: String = "bold", tracking: CGFloat = 0) {
    let face = font(weight == "bold" ? boldPath : mediumPath, size)
    let baseline = top + (lineHeight - CTFontGetAscent(face) - CTFontGetDescent(face)) / 2 + CTFontGetAscent(face)
    ctx.textPosition = CGPoint(x: x, y: CGFloat(ctx.height) - baseline)
    CTLineDraw(line(text, face, color(0x1e3028), tracking), ctx)
}

// Render every icon at its real target resolution, with a little extra breathing
// room at 16px. The source font is bundled; no installed-font fallback is possible.
func icon(_ size: Int, rounded: Bool = true) -> CGImage {
    let s = CGFloat(size), ctx = canvas(size, size)
    ctx.setFillColor(ink)
    ctx.addPath(CGPath(roundedRect: CGRect(x: 0, y: 0, width: s, height: s), cornerWidth: rounded ? s * 0.2 : 0, cornerHeight: rounded ? s * 0.2 : 0, transform: nil))
    ctx.fillPath()
    let face = font(boldPath, s * 0.46)
    let letters = line("YA", face, cream, -s * 0.0414)
    let slash = line("/", face, orange)
    let lettersWidth = CGFloat(CTLineGetTypographicBounds(letters, nil, nil, nil))
    let slashWidth = CGFloat(CTLineGetTypographicBounds(slash, nil, nil, nil))
    let gap = s * 0.0184
    let start = (s - lettersWidth - slashWidth - gap) / 2
    let baseline = (s - CTFontGetCapHeight(face)) / 2
    ctx.textPosition = CGPoint(x: start, y: baseline)
    CTLineDraw(letters, ctx)
    ctx.textPosition = CGPoint(x: start + lettersWidth + gap, y: baseline)
    CTLineDraw(slash, ctx)
    return ctx.makeImage()!
}
var iconImages: [Int: Data] = [:]
for size in [16, 32, 48, 64, 128, 180, 192, 256, 512] { iconImages[size] = png(icon(size)) }
try save(iconImages[16]!, "favicon-16.png")
try save(iconImages[32]!, "favicon-32.png")
try save(png(icon(180, rounded: false)), "apple-touch-icon.png")
try save(iconImages[192]!, "logo192.png")
try save(iconImages[512]!, "logo512.png")

// PNG-backed ICO directory: native multi-resolution fallback, including /favicon.ico.
func u16(_ value: Int) -> Data { var v = UInt16(value).littleEndian; return Data(bytes: &v, count: 2) }
func u32(_ value: Int) -> Data { var v = UInt32(value).littleEndian; return Data(bytes: &v, count: 4) }
let sizes = [16, 32, 48, 64, 128, 256]
var ico = u16(0) + u16(1) + u16(sizes.count), offset = 6 + 16 * sizes.count
for size in sizes {
    let data = iconImages[size]!
    ico.append(contentsOf: [UInt8(size == 256 ? 0 : size), UInt8(size == 256 ? 0 : size), 0, 0])
    ico.append(u16(1)); ico.append(u16(32)); ico.append(u32(data.count)); ico.append(u32(offset))
    offset += data.count
}
for size in sizes { ico.append(iconImages[size]!) }
try save(ico, "favicon.ico")

// Match the approved 1200x630 composition using the high-resolution garden plate.
// ImageIO writes a fresh sRGB image without carrying source EXIF/location metadata.
let card = canvas(1200, 630)
let garden = image("public/garden/cinematic/hero-wide-retina.webp")
let scale = max(1200 / CGFloat(garden.width), 630 / CGFloat(garden.height))
let width = CGFloat(garden.width) * scale, height = CGFloat(garden.height) * scale
card.draw(garden, in: CGRect(x: (1200 - width) / 2, y: (630 - height) / 2, width: width, height: height))
let veil = CGGradient(colorsSpace: srgb, colors: [color(0xf7f3e9, 117 / 255), color(0xf7f3e9, 37 / 255), color(0xf7f3e9, 0)] as CFArray, locations: [0, 0.35, 0.57])!
card.drawLinearGradient(veil, start: CGPoint(x: 0, y: 315), end: CGPoint(x: 1200, y: 315), options: [])
let fox = image("public/garden/companion-v2.webp")
card.draw(fox, in: CGRect(x: 432, y: 25.2, width: 276, height: 276))
drawText(card, "YANIV", x: 90, top: 138.6, size: 120, lineHeight: 117.6, tracking: -7.2)
drawText(card, "AKIVA", x: 90, top: 256.2, size: 120, lineHeight: 117.6, tracking: -7.2)
drawText(card, "i build stuff sometimes.", x: 90, top: 415.8, size: 27, lineHeight: 37.8, weight: "medium")
drawText(card, "yanivakiva.com", x: 90, top: 558.18, size: 19.8, lineHeight: 27.72, weight: "medium", tracking: 0.396)
try save(png(card.makeImage()!), "og.png")
