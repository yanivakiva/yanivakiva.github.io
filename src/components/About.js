import React from "react";
import "../styles/About.css";
import FadeInSection from "./FadeInSection";

class About extends React.Component {
  constructor() {
    super();
    this.state = {
      expanded: true,
      activeKey: "1"
    };
    this.handleSelect = this.handleSelect.bind(this);
  }
  handleSelect(eventKey) {
    this.setState({
      activeKey: eventKey
    });
  }
  render() {
    const one = (
      <p>
        I am currently working full-time at {" "} <a href="https://www.dokka.com">DOKKA</a> as a{" "}
        <b>Software Engineer</b>. and learning <b>Computer Science</b> at{" "}
        <b> The Open University</b>.
      </p>
    );
    const two = (
      <p>
        I'm highly motivated, hardworking and curious young professional
        who strives for development and innovation.
        Experienced in <b>software development</b>, data analysis, cyber security and networks.
        I'm into any sort of <b>software development</b> that requires
        problem-solving & being creative. My other areas of interest include <b>machine learning</b>,{" "}
        <b>human-computer interactions</b> and <b>full-stack development</b>.
        Among other things, in my free time i like to hike, travel and go nature-seeing.
      </p>
    );
    
    const desc_items = [one, two];

    const tech_stack = [
      "Python",
      "SQL & NoSQL",
      "ElasticSearch",
      "Java",
      "React.js",
      "HTML & CSS"
    ];

    const tech_items = tech_stack.map(stack => <li>{stack}</li>);
    var image = require("./assets/me.jpg");

    return (
      <div id="about">
        <FadeInSection>
          <div className="section-header ">
            <span className="section-title">/about</span>
          </div>
          <div className="about-content">
            <div className="about-description">
              {desc_items}
              {"Here are some technologies I have been working with:"}
              <ul className="tech-stack">
                {tech_stack.map(function (tech_item, i) {
                  return (
                    <FadeInSection delay={`${i + 1}00ms`}>
                      <li>{tech_item}</li>
                    </FadeInSection>
                  );
                })}
              </ul>
            </div>
            <div className="about-image">
              <img src={image} />
            </div>
          </div>
        </FadeInSection>
      </div>
    );
  }
}

export default About;
