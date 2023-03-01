//heroData.js

export default async function heroHandler(req, res) {
    const heroData = {
      page1: {
        title: "Drilling Beyond Limits",
        contactButtonLabel: "Get A Free Quote",
        id: 'hero-image1',
        cards: [
          {
            title: "13-Time ADSC Safety Award Winner",
            description: "Fully-licensed and insured by the Texas State License Board.",
          },
          {
            title: "Experienced and Knowledgable",
            description: "Privately-owned and locally-operated for more than 30 years.",
          },
          {
            title: "Limited Access Pier Drilling Specialist",
            description: "Working conditions cramped? Not an issue for S&W Foundations Contractors Inc.!",
          },
          {
            title: "Nation-Wide Service",
            description: "Here at S&W Foundation Contractors Inc. we offer our services Nation-Wide!",
          },
        ],
        image: {
            src: '/heroImg1.png',
            width: 580,
            height: 515,
            alt: 'Drilling Beyond Limits',
            
        }
      },
      page2: {
        title: "About Us",
        contactButtonLabel: "Get A Free Quote",
        cards: [
          {
            title: "Where Family Comes First",
            description: "Privately-owned and locally-operated for more than 30 years.",
          },
          {
            title: "People Over Profit",
            description: "We prioritize creating a positive and inclusive company culture.",
          },
          {
            title: "Safe and secure, every project",
            description: "Safety is at the core of everything we do and remains our top priority!",
          },
          {
            title: "Customer Satisfaction",
            description: "We are dedicated to delivering quality work and exceptional customer service, ensuring your satisfaction with every project.",
          },
        ],
        image: {
          src: '/home.jpeg',
          width: 560,
          height: 565,
          alt: 'About Us',
          id: 'aboutImg'
         
        }
      },
  
      page3: {
        title: "Services",
        contactButtonLabel: "Get A Free Quote",
        cards: [
          {
            title: "Pier Driling Experts",
            description: "S&W offers more knowledge and better equipment than your average driller.",
          },
          {
            title: "Safe and Professional",
            description: "S&W's top priority is Safety and we dedicate ourselves to educating all employees.",
          },
          {
            title: "Top Of The Line Equipment",
            description: "We are proudly able to offer the best equipment on the market to our clients.",
          },
          {
            title: "We Aim To Please",
            description: "Here at S&W Foundation Contractors Inc. we pride ourselves on doing quality work and keeping our clients projects on schedule!",
          },
        ],
        image: {
          src: '/ttyy.jpeg',
          width: 560,
          height: 565,
          alt: 'Drilling Beyond Limits',
          id: "serviceImg",
        
        }
      },
    };
    return heroData;
    
  }