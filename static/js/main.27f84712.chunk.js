(this["webpackJsonpyaniv-akiva"]=this["webpackJsonpyaniv-akiva"]||[]).push([[0],{158:function(e,a,t){e.exports=t(299)},163:function(e,a,t){},164:function(e,a,t){},288:function(e,a,t){},290:function(e,a,t){},291:function(e,a,t){},292:function(e,a,t){e.exports=t.p+"static/media/me.9d122eb2.jpg"},293:function(e,a,t){},294:function(e,a,t){},295:function(e,a,t){},299:function(e,a,t){"use strict";t.r(a);var n=t(0),i=t.n(n),r=t(25),l=t.n(r),c=(t(163),t(1)),o=t(6),s=t(14),d=t(3),m=t(4),u=t(322),v=t(63),h=t.n(v),b=t(146),p=t.n(b),f=t(145),E=t.n(f),y=(t(164),t(102),t(36));function w(e){var a=i.a.useState(!1),t=Object(y.a)(a,2),n=t[0],r=t[1],l=i.a.useRef();return i.a.useEffect((function(){new IntersectionObserver((function(e){e.forEach((function(e){return r(e.isIntersecting)}))})).observe(l.current)}),[]),i.a.createElement("div",{className:"fade-in-section ".concat(n?"is-visible":""),style:{transitionDelay:"".concat(e.delay)},ref:l},e.children)}var g=window.innerWidth<600,k=function(e){Object(d.a)(t,e);var a=Object(m.a)(t);function t(){var e;return Object(c.a)(this,t),(e=a.call(this)).state={expanded:!0,activeKey:"1"},e.handleSelect=e.handleSelect.bind(Object(s.a)(e)),e}return Object(o.a)(t,[{key:"handleSelect",value:function(e){this.setState({activeKey:e})}},{key:"render",value:function(){var e=this.state.expanded,a=[i.a.createElement("a",{href:"/"},"/home"),i.a.createElement("a",{href:"#about"},"/about"),i.a.createElement("a",{href:"#experience"},"/experience")];return i.a.createElement("div",{className:"sidebar-nav"},!g&&i.a.createElement(u.a,{expanded:e,defaultOpenKeys:["3","4"],activeKey:this.state.activeKey,onSelect:this.handleSelect,appearance:"subtle"},i.a.createElement(u.a.Body,null,i.a.createElement("div",{className:"sidebar-links"},a.map((function(e,a){return i.a.createElement(w,{delay:"".concat(a+1,"00ms")},i.a.createElement("div",null,e))}))))),i.a.createElement("div",{className:"sidebar-logos",href:"/"},i.a.createElement("a",{href:"mailto:yanivakiva20@gmail.com"},i.a.createElement(h.a,{style:{fontSize:20}})),i.a.createElement("a",{href:"https://github.com/yanivakiva"},i.a.createElement(E.a,{style:{fontSize:17}})),i.a.createElement("a",{href:"https://www.linkedin.com/in/yanivakiva"},i.a.createElement(p.a,{style:{fontSize:20}}))))}}]),t}(i.a.Component),S=(t(288),t(147)),j=t.n(S),O=t(5),x=t(148),N=function(e){Object(d.a)(t,e);var a=Object(m.a)(t);function t(){return Object(c.a)(this,t),a.apply(this,arguments)}return Object(o.a)(t,[{key:"componentDidMount",value:function(){!function(){var e,a,t,n,i,r,l,c=new O.i;function o(e,a,t){var n=function(e,a,t){var n=0,i=0,r={x:window.innerWidth,y:window.innerHeight};e<=r.x/4&&(n=t*((r.x/4-e)/(r.x/4)*100)/100*-1);e>=r.x/4&&(n=t*((e-r.x/4)/(r.x/4)*100)/300);a<=r.y/2&&(i=.5*t*((r.y/2-a)/(r.y/2)*100)/100*-1);a>=r.y/2&&(i=t*((a-r.y/2)/(r.y/2)*100)/100);return{x:n,y:i}}(e.x,e.y,t);a.rotation.y=O.G.degToRad(n.x),a.rotation.x=O.G.degToRad(n.y)}!function(){(e=new O.eb).background=new O.j(1447450),e.fog=null,(a=new O.rb({alpha:!0})).shadowMap.enabled=!0,a.setSize(.35*window.innerWidth,.35*window.innerHeight),document.getElementById("yaniv-model").appendChild(a.domElement),(t=new O.V(65,window.innerWidth/window.innerHeight,.1,1e3)).position.z=30,t.position.x=0,t.position.y=-10;var c=(new O.lb).load("https://s3.eu-central-1.amazonaws.com/yanivakiva.groot/groot_BaseColor.tga.png");c.flipY=!1;var o=new O.L({map:c,color:16777215,skinning:!0});(new x.a).load("https://s3.eu-central-1.amazonaws.com/yanivakiva.groot/last_groot.glb",(function(a){n=a.scene;var t=a.animations;console.error(t),n.traverse((function(e){e.isMesh&&(e.castShadow=!0,e.receiveShadow=!0,e.material=o),e.isBone&&"mixamorigNeck"===e.name&&(i=e),e.isBone&&"mixamorigSpine"===e.name&&(r=e)})),n.scale.set(2,2,2),n.position.y=-15,e.add(n),l=new O.b(n),console.error(t);O.a.findByName(t,"idle");t[0].tracks.splice(3,3),t[0].tracks.splice(9,3),l.clipAction(t[0]).play()}),void 0,(function(e){console.error(e)}));var s=new O.p(16777215,16777215,.61);s.position.set(-7,50,0),e.add(s);var d=8.25,m=new O.k(16777215,.54);m.position.set(-20,12,8),m.castShadow=!0,m.shadow.mapSize=new O.ob(1024,1024),m.shadow.camera.near=.1,m.shadow.camera.far=1500,m.shadow.camera.left=-8.25,m.shadow.camera.right=d,m.shadow.camera.top=d,m.shadow.camera.bottom=-8.25,e.add(m);var u=new O.W(100,30,1,1),v=new O.L({color:1447450,shininess:0}),h=new O.J(u,v);h.rotation.x=-.5*Math.PI,h.receiveShadow=!0,h.position.y=-15,e.add(h);var b=new O.ib(20,50,55),p=new O.K({color:8346352}),f=new O.J(b,p);f.position.z=-40,f.position.y=-5,f.position.x=-.25,e.add(f)}(),function n(){if(l&&l.update(c.getDelta()),function(e){var a=e.domElement,t=window.innerWidth,n=window.innerHeight,i=a.width/window.devicePixelRatio,r=a.height/window.devicePixelRatio,l=i!==t||r!==n;l&&e.setSize(t,n,!1);return l}(a)){var i=a.domElement;t.aspect=i.clientWidth/i.clientHeight,t.updateProjectionMatrix()}a.render(e,t),requestAnimationFrame(n)}(),document.addEventListener("mousemove",(function(e){var a=function(e){return{x:e.clientX,y:e.clientY}}(e);i&&r&&(o(a,i,50),o(a,r,30))}))}()}},{key:"render",value:function(){var e=this;return i.a.createElement("div",{ref:function(a){return e.mount=a}})}}]),t}(n.Component),I=function(e){Object(d.a)(t,e);var a=Object(m.a)(t);function t(){var e;return Object(c.a)(this,t),(e=a.call(this)).state={expanded:!0,activeKey:"1",visible:!0},e.handleSelect=e.handleSelect.bind(Object(s.a)(e)),e}return Object(o.a)(t,[{key:"handleSelect",value:function(e){this.setState({activeKey:e})}},{key:"render",value:function(){return i.a.createElement("div",{id:"intro"},i.a.createElement("div",{id:"yaniv-model"},i.a.createElement(N,null)),i.a.createElement("div",null,i.a.createElement("br",null)),i.a.createElement(j.a,{avgTypingDelay:120},i.a.createElement("span",{className:"intro-title"},"hi, ",i.a.createElement("span",{className:"intro-name"},"yaniv")," here.")),i.a.createElement(w,null,i.a.createElement("div",{className:"intro-subtitle"},"I create stuff sometimes."),i.a.createElement("div",{className:"intro-desc"},"I'm a software engineer, hiker, minimalist. based in Israel. I have profound interest in software development, cyber-security, machine learning, human-computer interactions, and everything in between."),i.a.createElement("a",{href:"mailto:yanivakiva20@gmail.com",className:"intro-contact"},i.a.createElement(h.a,null),"  Say hello")))}}]),t}(i.a.Component),K=t(151),D=t(320),C=t(324),A=t(321),P=t(319),z=t(323),R=window.innerWidth<600;function W(e){var a=e.children,t=e.value,n=e.index,r=Object(K.a)(e,["children","value","index"]);return R?i.a.createElement("div",Object.assign({role:"tabpanel",hidden:t!==n,id:"full-width-tabpanel-".concat(n),"aria-labelledby":"full-width-tab-".concat(n)},r),t===n&&i.a.createElement(z.a,{p:3},i.a.createElement(P.a,null,a))):i.a.createElement("div",Object.assign({role:"tabpanel",hidden:t!==n,id:"vertical-tabpanel"},r),t===n&&i.a.createElement(z.a,{p:3},i.a.createElement(P.a,null,a)))}var T=Object(D.a)((function(e){return{root:{flexGrow:1,backgroundColor:"theme.palette.background.paper",display:"flex",height:95},tabs:{borderRight:"1px solid ".concat(e.palette.divider)}}})),B=function(){var e=T(),a=i.a.useState(0),t=Object(y.a)(a,2),n=t[0],r=t[1],l={DOKKA:{jobTitle:"Software Engineer @",duration:"NOV 2020 - SEP 2022",desc:["Developed a document understanding framework that performs key phrase detection, table and figure extraction, asynchronous batch-documents scanning, and document matching","Integrated our system to SAP's ERP's system resulting in increased exposure to potential clients","Developed an Asynchronous Publisher-Consumer framework using RabbitMQ, increasing system efficiency by ~30%","Developed backend modules, REST API\u2019s, and middlewares using Python, Flask, and SQLAlchemy"]},IDF:{jobTitle:"Software Engineer @",duration:"FEB 2018 - NOV 2020",desc:["Developed and implemented CI/CD pipelines using Azure DevOps to automatically build and deploy python applications to Kubernetes clusters","Developed backend modules using Python and SQLAlchemy","Developed and designed REST APIs microservices using python Flask framework","Developed applications, algorithms, and modules using python to obtain intelligence data and technological insights from relational and non-relational databases"]}};return i.a.createElement("div",{className:e.root},i.a.createElement(C.a,{orientation:R?null:"vertical",variant:R?"fullWidth":"scrollable",value:n,onChange:function(e,a){r(a)},className:e.tabs},Object.keys(l).map((function(e,a){return i.a.createElement(A.a,Object.assign({label:R?"{key}":e},(t=a,R?{id:"full-width-tab-".concat(t),"aria-controls":"full-width-tabpanel-".concat(t)}:{id:"vertical-tab-".concat(t)})));var t}))),Object.keys(l).map((function(e,a){return i.a.createElement(W,{value:n,index:a},i.a.createElement("span",{className:"joblist-job-title"},l[e].jobTitle+" "),i.a.createElement("span",{className:"joblist-job-company"},e),i.a.createElement("div",{className:"joblist-duration"},l[e].duration),i.a.createElement("ul",{className:"job-description"},l[e].desc.map((function(e,a){return i.a.createElement(w,{delay:"".concat(a+1,"00ms")},i.a.createElement("li",{key:a},e))}))))})))},L=(t(290),function(e){Object(d.a)(t,e);var a=Object(m.a)(t);function t(){var e;return Object(c.a)(this,t),(e=a.call(this)).state={expanded:!0,activeKey:"1"},e.handleSelect=e.handleSelect.bind(Object(s.a)(e)),e}return Object(o.a)(t,[{key:"handleSelect",value:function(e){this.setState({activeKey:e})}},{key:"render",value:function(){return i.a.createElement("div",{id:"experience"},i.a.createElement(w,null,i.a.createElement("div",{className:"section-header "},i.a.createElement("span",{className:"section-title"},"/experience")),i.a.createElement(B,null)))}}]),t}(i.a.Component)),M=(t(291),function(e){Object(d.a)(n,e);var a=Object(m.a)(n);function n(){var e;return Object(c.a)(this,n),(e=a.call(this)).state={expanded:!0,activeKey:"1"},e.handleSelect=e.handleSelect.bind(Object(s.a)(e)),e}return Object(o.a)(n,[{key:"handleSelect",value:function(e){this.setState({activeKey:e})}},{key:"render",value:function(){var e=[i.a.createElement("p",null,"I am currently working full-time at "," "," ",i.a.createElement("a",{href:"https://www.sygnia.co/"},"Sygnia")," as a"," ",i.a.createElement("b",null,"Software Engineer"),". and learning ",i.a.createElement("b",null,"Computer Science")," at"," ",i.a.createElement("b",null," The Open University"),"."),i.a.createElement("p",null,"I'm highly motivated, hardworking and curious young professional who strives for development and innovation. Experienced in ",i.a.createElement("b",null,"software development"),", data analysis, cyber security and networks. I'm into any sort of ",i.a.createElement("b",null,"software development")," that requires problem-solving & being creative. My other areas of interest include ",i.a.createElement("b",null,"machine learning"),","," ",i.a.createElement("b",null,"human-computer interactions")," and ",i.a.createElement("b",null,"full-stack development"),". Among other things, in my free time i like to hike, travel and go nature-seeing.")],a=["Python","SQL & NoSQL","ElasticSearch","Java","React.js","HTML & CSS"],n=(a.map((function(e){return i.a.createElement("li",null,e)})),t(292));return i.a.createElement("div",{id:"about"},i.a.createElement(w,null,i.a.createElement("div",{className:"section-header "},i.a.createElement("span",{className:"section-title"},"/about")),i.a.createElement("div",{className:"about-content"},i.a.createElement("div",{className:"about-description"},e,"Here are some technologies I have been working with:",i.a.createElement("ul",{className:"tech-stack"},a.map((function(e,a){return i.a.createElement(w,{delay:"".concat(a+1,"00ms")},i.a.createElement("li",null,e))})))),i.a.createElement("div",{className:"about-image"},i.a.createElement("img",{src:n})))))}}]),n}(i.a.Component)),H=(t(293),function(e){Object(d.a)(t,e);var a=Object(m.a)(t);function t(){var e;return Object(c.a)(this,t),(e=a.call(this)).state={expanded:!0,activeKey:"1"},e.handleSelect=e.handleSelect.bind(Object(s.a)(e)),e}return Object(o.a)(t,[{key:"handleSelect",value:function(e){this.setState({activeKey:e})}},{key:"render",value:function(){return i.a.createElement(w,null,i.a.createElement("div",{id:"credits"},i.a.createElement("div",{className:"ending-credits"},i.a.createElement("div",null,"Designed by Yaniv Akiva. "),i.a.createElement("div",null,"All rights reserved. \xa9"))))}}]),t}(i.a.Component));t(294),t(295),t(296);var F=function(){return i.a.createElement("div",{className:"App"},i.a.createElement("div",{id:"content"},i.a.createElement(I,null),i.a.createElement(M,null),i.a.createElement(L,null),i.a.createElement("br",null),i.a.createElement("br",null),i.a.createElement("br",null),i.a.createElement("br",null),i.a.createElement("br",null),i.a.createElement("br",null),i.a.createElement("br",null),i.a.createElement("br",null),i.a.createElement(H,null)),i.a.createElement(k,null))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));t(297);var J=t(150);l.a.render(i.a.createElement(J.a,null,i.a.createElement(F,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[158,1,2]]]);
//# sourceMappingURL=main.27f84712.chunk.js.map