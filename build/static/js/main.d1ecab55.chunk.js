(this["webpackJsonpyaniv-akiva"]=this["webpackJsonpyaniv-akiva"]||[]).push([[0],{160:function(e,t,a){e.exports=a(302)},165:function(e,t,a){},166:function(e,t,a){},290:function(e,t,a){},292:function(e,t,a){},293:function(e,t,a){},294:function(e,t,a){e.exports=a.p+"static/media/me.9d122eb2.jpg"},295:function(e,t,a){},296:function(e,t,a){},297:function(e,t,a){},298:function(e,t,a){},302:function(e,t,a){"use strict";a.r(t);var n=a(0),i=a.n(n),r=a(25),o=a.n(r),c=(a(165),a(1)),l=a(6),s=a(14),d=a(3),m=a(4),u=a(325),h=a(66),v=a.n(h),p=a(146),f=a.n(p),b=a(70),g=a.n(b),y=(a(166),a(103),a(36));function E(e){var t=i.a.useState(!1),a=Object(y.a)(t,2),n=a[0],r=a[1],o=i.a.useRef();return i.a.useEffect((function(){new IntersectionObserver((function(e){e.forEach((function(e){return r(e.isIntersecting)}))})).observe(o.current)}),[]),i.a.createElement("div",{className:"fade-in-section ".concat(n?"is-visible":""),style:{transitionDelay:"".concat(e.delay)},ref:o},e.children)}var w=window.innerWidth<600,j=function(e){Object(d.a)(a,e);var t=Object(m.a)(a);function a(){var e;return Object(c.a)(this,a),(e=t.call(this)).state={expanded:!0,activeKey:"1"},e.handleSelect=e.handleSelect.bind(Object(s.a)(e)),e}return Object(l.a)(a,[{key:"handleSelect",value:function(e){this.setState({activeKey:e})}},{key:"render",value:function(){var e=this.state.expanded,t=[i.a.createElement("a",{href:"/"},"/home"),i.a.createElement("a",{href:"#about"},"/about"),i.a.createElement("a",{href:"#experience"},"/experience"),i.a.createElement("a",{href:"#projects"},"/software-creations")];return i.a.createElement("div",{className:"sidebar-nav"},!w&&i.a.createElement(u.a,{expanded:e,defaultOpenKeys:["3","4"],activeKey:this.state.activeKey,onSelect:this.handleSelect,appearance:"subtle"},i.a.createElement(u.a.Body,null,i.a.createElement("div",{className:"sidebar-links"},t.map((function(e,t){return i.a.createElement(E,{delay:"".concat(t+1,"00ms")},i.a.createElement("div",null,e))}))))),i.a.createElement("div",{className:"sidebar-logos",href:"/"},i.a.createElement("a",{href:"mailto:yanivakiva20@gmail.com"},i.a.createElement(v.a,{style:{fontSize:20}})),i.a.createElement("a",{href:"https://github.com/yanivakiva"},i.a.createElement(g.a,{style:{fontSize:19}})),i.a.createElement("a",{href:"https://www.linkedin.com/in/yanivakiva"},i.a.createElement(f.a,{style:{fontSize:21}}))))}}]),a}(i.a.Component),k=(a(290),a(147)),S=a.n(k),x=a(5),N=a(148),O=function(e){Object(d.a)(a,e);var t=Object(m.a)(a);function a(){return Object(c.a)(this,a),t.apply(this,arguments)}return Object(l.a)(a,[{key:"componentDidMount",value:function(){!function(){var e,t,a,n,i,r,o,c=new x.i;function l(e,t,a){var n=function(e,t,a){var n=0,i=0,r={x:window.innerWidth,y:window.innerHeight};e<=r.x/2&&(n=a*((r.x/2-e)/(r.x/2)*100)/100*-1);e>=r.x/2&&(n=a*((e-r.x/2)/(r.x/2)*100)/100);t<=r.y/2&&(i=.5*a*((r.y/2-t)/(r.y/2)*100)/100*-1);t>=r.y/2&&(i=a*((t-r.y/2)/(r.y/2)*100)/100);return{x:n,y:i}}(e.x,e.y,a);t.rotation.y=x.G.degToRad(n.x),t.rotation.x=x.G.degToRad(n.y)}!function(){(e=new x.eb).background=new x.j(1447450),e.fog=null,(t=new x.rb({alpha:!0})).shadowMap.enabled=!0,t.setSize(.35*window.innerWidth,.35*window.innerHeight);var c=document.getElementById("yaniv-model");document.title="Yaniv",c.appendChild(t.domElement),(a=new x.V(65,window.innerWidth/window.innerHeight,.1,1e3)).position.z=30,a.position.x=0,a.position.y=-3;var l=(new x.lb).load("https://textractexample-textractcognitodemobucket90cf6a3d-1325eomlv7h2u.s3.eu-west-1.amazonaws.com/groot_BaseColor.tga.png");l.flipY=!1;var s=new x.L({map:l,color:16777215,skinning:!0});(new N.a).load("https://textractexample-textractcognitodemobucket90cf6a3d-1325eomlv7h2u.s3.eu-west-1.amazonaws.com/last_groot.glb",(function(t){n=t.scene;var a=t.animations;console.error(a),n.traverse((function(e){e.isMesh&&(e.castShadow=!0,e.receiveShadow=!0,e.material=s),e.isBone&&"mixamorigNeck"===e.name&&(i=e),e.isBone&&"mixamorigSpine"===e.name&&(r=e)})),n.scale.set(2,2,2),n.position.y=-10,e.add(n),o=new x.b(n),console.error(a);x.a.findByName(a,"idle");a[0].tracks.splice(3,3),a[0].tracks.splice(9,3),o.clipAction(a[0]).play()}),void 0,(function(e){console.error(e)}));var d=new x.p(16777215,16777215,.61);d.position.set(0,50,0),e.add(d);var m=8.25,u=new x.k(16777215,.54);u.position.set(-8,12,8),u.castShadow=!0,u.shadow.mapSize=new x.ob(1024,1024),u.shadow.camera.near=.1,u.shadow.camera.far=1500,u.shadow.camera.left=-8.25,u.shadow.camera.right=m,u.shadow.camera.top=m,u.shadow.camera.bottom=-8.25,e.add(u);var h=new x.W(5e3,5e3,1,1),v=new x.L({color:1447450,shininess:0}),p=new x.J(h,v);p.rotation.x=-.5*Math.PI,p.receiveShadow=!0,p.position.y=-11,e.add(p);var f=new x.ib(16,46,46),b=new x.K({color:8346352}),g=new x.J(f,b);g.position.z=-30,g.position.y=-2.5,g.position.x=-.25,e.add(g)}(),function n(){if(o&&o.update(c.getDelta()),function(e){var t=e.domElement,a=window.innerWidth,n=window.innerHeight,i=t.width/window.devicePixelRatio,r=t.height/window.devicePixelRatio,o=i!==a||r!==n;o&&e.setSize(a,n,!1);return o}(t)){var i=t.domElement;a.aspect=i.clientWidth/i.clientHeight,a.updateProjectionMatrix()}t.render(e,a),requestAnimationFrame(n)}(),document.addEventListener("mousemove",(function(e){var t=function(e){return{x:e.clientX,y:e.clientY}}(e);i&&r&&(l(t,i,50),l(t,r,30))}))}()}},{key:"render",value:function(){var e=this;return i.a.createElement("div",{ref:function(t){return e.mount=t}})}}]),a}(n.Component),A=function(e){Object(d.a)(a,e);var t=Object(m.a)(a);function a(){var e;return Object(c.a)(this,a),(e=t.call(this)).state={expanded:!0,activeKey:"1",visible:!0},e.handleSelect=e.handleSelect.bind(Object(s.a)(e)),e}return Object(l.a)(a,[{key:"handleSelect",value:function(e){this.setState({activeKey:e})}},{key:"render",value:function(){return i.a.createElement("div",{id:"intro"},i.a.createElement("div",{id:"yaniv-model"},i.a.createElement(O,null)),i.a.createElement(S.a,{avgTypingDelay:120},i.a.createElement("span",{className:"intro-title"},"hi, ",i.a.createElement("span",{className:"intro-name"},"yaniv")," here.")),i.a.createElement(E,null,i.a.createElement("div",{className:"intro-subtitle"},"I create stuff sometimes."),i.a.createElement("div",{className:"intro-desc"},"I'm a software engineer and artist based in Israel. I have profound interest in Backend development, machine learning, human-computer interactions, and everything in between."),i.a.createElement("a",{href:"mailto:yanivakiva20@gmail.com",className:"intro-contact"},i.a.createElement(v.a,null),"  Say hello")))}}]),a}(i.a.Component),z=a(153),I=a(323),T=a(327),C=a(324),P=a(322),M=a(326),B=window.innerWidth<600;function D(e){var t=e.children,a=e.value,n=e.index,r=Object(z.a)(e,["children","value","index"]);return B?i.a.createElement("div",Object.assign({role:"tabpanel",hidden:a!==n,id:"full-width-tabpanel-".concat(n),"aria-labelledby":"full-width-tab-".concat(n)},r),a===n&&i.a.createElement(M.a,{p:3},i.a.createElement(P.a,null,t))):i.a.createElement("div",Object.assign({role:"tabpanel",hidden:a!==n,id:"vertical-tabpanel"},r),a===n&&i.a.createElement(M.a,{p:3},i.a.createElement(P.a,null,t)))}var R=Object(I.a)((function(e){return{root:{flexGrow:1,backgroundColor:"theme.palette.background.paper",display:"flex",height:300},tabs:{borderRight:"1px solid ".concat(e.palette.divider)}}})),K=function(){var e=R(),t=i.a.useState(0),a=Object(y.a)(t,2),n=a[0],r=a[1],o={Wattpad:{jobTitle:"Software Engineer (PEY) @",duration:"MAY 2020 - APR 2021",desc:["Developed a responsive React web page (the new Story Details) from scratch, both on client and server side, for an app with massive scale (2 billion daily requests).","Iteratively built web experiences for 80 million users across high-traffic pages.","Measured and analyzed real-world user metrics by leveraging Amplitude and Datadog.","Collaborated with senior engineers and product management following best practices for the full software development life cycle, including coding standards, code reviews, source control management, build processes, testing, and operations."]},UofT:{jobTitle:"Research Engineer @",duration:"MAY 2021 - SEPT 2021",desc:["Developing and researching an NLP-based framework using state-of-the-art tools like Spacy and Stanza to facilitate the derivation of requirements from health data by leveraging syntactic dependencies, entity-recognition and rule-based match-making."," Application selected for DCS Research Award ($4,000) as part of the \u201dVisualizing Privacy Analysis Results\u201d project led by Professor Marsha Chechik."]},Centivizer:{jobTitle:"Research Developer @",duration:"SEPT 2019 - APR 2020",desc:["Researched and developed interactive and neural-activation technologies to stimulate physical and cognitive functions in order to slow the progression of neurodegenerative disorders.","Leveraged WebRTC to develop and maintain a Node.js online video-streaming platform in real-time competitive-mode games to research the effects of active stimulation for those suffering from dementia."]},TDSB:{jobTitle:"Software Engineer @",duration:"SEPT 2019 - DEC 2020",desc:["Co-developed homework management software integrable with Google Classroom by utilizing the Python\u2019s Flask micro-framework for the back-end API and Vue.js for the front-end UI, in order to translate business requirements into a functional full-stack application."]},"Orange Gate":{jobTitle:"Software Engineering Intern @",duration:"MAY 2019 - AUG 2019",desc:["Developed a Node.js smart home system through Facebook\u2019s Messenger integrated with Bocco sen- sors and other smart devices (Nest camera, TPLink smart plugs) to derive conclusions about the current state of the home","Identified continuous improvements in data quality, design reports and coding activities, presenting results and findings to internal business stakeholders.","Relevant technologies/tools used: DialogFlow, Vision, AutoML, Messenger Bot API, MongoDB."]}};return i.a.createElement("div",{className:e.root},i.a.createElement(T.a,{orientation:B?null:"vertical",variant:B?"fullWidth":"scrollable",value:n,onChange:function(e,t){r(t)},className:e.tabs},Object.keys(o).map((function(e,t){return i.a.createElement(C.a,Object.assign({label:B?"0".concat(t,"."):e},(a=t,B?{id:"full-width-tab-".concat(a),"aria-controls":"full-width-tabpanel-".concat(a)}:{id:"vertical-tab-".concat(a)})));var a}))),Object.keys(o).map((function(e,t){return i.a.createElement(D,{value:n,index:t},i.a.createElement("span",{className:"joblist-job-title"},o[e].jobTitle+" "),i.a.createElement("span",{className:"joblist-job-company"},e),i.a.createElement("div",{className:"joblist-duration"},o[e].duration),i.a.createElement("ul",{className:"job-description"},o[e].desc.map((function(e,t){return i.a.createElement(E,{delay:"".concat(t+1,"00ms")},i.a.createElement("li",{key:t},e))}))))})))},W=(a(292),function(e){Object(d.a)(a,e);var t=Object(m.a)(a);function a(){var e;return Object(c.a)(this,a),(e=t.call(this)).state={expanded:!0,activeKey:"1"},e.handleSelect=e.handleSelect.bind(Object(s.a)(e)),e}return Object(l.a)(a,[{key:"handleSelect",value:function(e){this.setState({activeKey:e})}},{key:"render",value:function(){return i.a.createElement("div",{id:"experience"},i.a.createElement(E,null,i.a.createElement("div",{className:"section-header "},i.a.createElement("span",{className:"section-title"},"/ experience")),i.a.createElement(K,null)))}}]),a}(i.a.Component)),L=(a(293),function(e){Object(d.a)(n,e);var t=Object(m.a)(n);function n(){var e;return Object(c.a)(this,n),(e=t.call(this)).state={expanded:!0,activeKey:"1"},e.handleSelect=e.handleSelect.bind(Object(s.a)(e)),e}return Object(l.a)(n,[{key:"handleSelect",value:function(e){this.setState({activeKey:e})}},{key:"render",value:function(){var e=i.a.createElement("p",null,"I am currently studying ",i.a.createElement("b",null,"Computer Science")," at"," ",i.a.createElement("b",null," University of Toronto "),", with a focus in Software Systems and Artificial Intelligence. Last year, I was on a one year internship at"," ",i.a.createElement("a",{href:"https://www.wattpad.com"},"Wattpad")," as a"," ",i.a.createElement("b",null,"Software Engineer"),"."),t=i.a.createElement("p",null,"I'm into any sort of ",i.a.createElement("b",null,"software development")," that requires creativity. My other areas of interest include ",i.a.createElement("b",null,"machine learning"),","," ",i.a.createElement("b",null,"human-computer interactions")," and ",i.a.createElement("b",null,"frontend development"),". I also like my fair share of visual arts and video editing. In my free time, I eat guava fruit and play video games."),n=[e,t],r=["Javascript ES6+","Python","React.js","Java","Node.js","HTML & CSS"],o=(r.map((function(e){return i.a.createElement("li",null,e)})),a(294));return i.a.createElement("div",{id:"about"},i.a.createElement(E,null,i.a.createElement("div",{className:"section-header "},i.a.createElement("span",{className:"section-title"},"/ about me")),i.a.createElement("div",{className:"about-content"},i.a.createElement("div",{className:"about-description"},n,"Here are some technologies I have been working with:",i.a.createElement("ul",{className:"tech-stack"},r.map((function(e,t){return i.a.createElement(E,{delay:"".concat(t+1,"00ms")},i.a.createElement("li",null,e))})))),i.a.createElement("div",{className:"about-image"},i.a.createElement("img",{src:o})))))}}]),n}(i.a.Component)),H=(a(295),a(149)),J=a.n(H),Y=a(150),G=a.n(Y),q=function(e){Object(d.a)(a,e);var t=Object(m.a)(a);function a(){var e;return Object(c.a)(this,a),(e=t.call(this)).state={expanded:!0,activeKey:"1"},e.handleSelect=e.handleSelect.bind(Object(s.a)(e)),e}return Object(l.a)(a,[{key:"handleSelect",value:function(e){this.setState({activeKey:e})}},{key:"render",value:function(){var e={"TDSB Homework Management Interface":{desc:"An application created for Toronto District School Board, with a Flask back-end and a Vue front-end.",techStack:"Python (Flask), Vue.js, Bootstrap, SQL",link:"https://github.com/gazijarin/TDSBHomeworkManagement",open:"https://tdsb-app.herokuapp.com/"},"Adam A.I.":{desc:"A self-learning A.I. that learns to traverse through a complex maze using the genetic algorithm.",techStack:"Javascript, HTML / CSS",link:"https://github.com/gazijarin/adamai",open:"https://gazijarin.github.io/AdamAI/"},Truth:{desc:"A three.js simulation of the planet system revolving around a monolith.",techStack:"Three.js",link:"https://github.com/gazijarin/truth",open:"https://gazijarin.github.io/Truth/"},"Odin Bot":{desc:"A Telegram bot that helps you excel on your daily tasks through Node NLP.",techStack:"Javascript, Node.js, Natural NLP, Telegram API",link:"https://github.com/gazijarin/OdinBot",open:""},"Game Centre":{desc:"An Android app consisting of three board games, including multiplayer, autosave, user authentication, etc.",techStack:"Java, Android Studio",link:"https://github.com/gazijarin/gamecentre",open:""},"Minimax Stonehenge":{desc:"Two-player, zero-sum game with a strategic Minimax artificial intelligence.",techStack:"Python",link:"https://github.com/gazijarin/stonehenge",open:""}};return i.a.createElement("div",{id:"projects"},i.a.createElement("div",{className:"section-header "},i.a.createElement("span",{className:"section-title"},"/ software-creations")),i.a.createElement("div",{className:"project-container"},i.a.createElement("ul",{className:"projects-grid"},Object.keys(e).map((function(t,a){return i.a.createElement(E,{delay:"".concat(a+1,"00ms")},i.a.createElement("li",{className:"projects-card"},i.a.createElement("div",{className:"card-header"},i.a.createElement("div",{className:"folder-icon"},i.a.createElement(J.a,{style:{fontSize:35}})),i.a.createElement("span",{className:"external-links"},i.a.createElement("a",{className:"github-icon",href:e[t].link},i.a.createElement(g.a,{style:{fontSize:20,color:"var(--lightest-slate)"}})),e[t].open&&i.a.createElement("a",{className:"open-icon",href:e[t].open},i.a.createElement(G.a,{style:{fontSize:25,color:"var(--lightest-slate)"}})))),i.a.createElement("div",{className:"card-title"},t),i.a.createElement("div",{className:"card-desc"},e[t].desc),i.a.createElement("div",{className:"card-tech"},e[t].techStack)))})))))}}]),a}(i.a.Component),F=(a(296),function(e){Object(d.a)(a,e);var t=Object(m.a)(a);function a(){var e;return Object(c.a)(this,a),(e=t.call(this)).state={expanded:!0,activeKey:"1"},e.handleSelect=e.handleSelect.bind(Object(s.a)(e)),e}return Object(l.a)(a,[{key:"handleSelect",value:function(e){this.setState({activeKey:e})}},{key:"render",value:function(){return i.a.createElement(E,null,i.a.createElement("div",{id:"credits"},i.a.createElement("div",{className:"ending-credits"},i.a.createElement("div",null,"Built and designed by Yaniv Akiva. "),i.a.createElement("div",null,"All rights reserved. \xa9"))))}}]),a}(i.a.Component));a(297),a(298),a(299);var V=function(){return i.a.createElement("div",{className:"App"},i.a.createElement("div",{id:"content"},i.a.createElement(A,null),i.a.createElement(L,null),i.a.createElement(W,null),i.a.createElement(q,null),i.a.createElement(F,null)),i.a.createElement(j,null))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));a(300);var U=a(152);o.a.render(i.a.createElement(U.a,null,i.a.createElement(V,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[160,1,2]]]);
//# sourceMappingURL=main.d1ecab55.chunk.js.map