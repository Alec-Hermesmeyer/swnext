export default async function handler(req, res) {
    
    const data = [
      {
        id: 1,
        title: 'About',
        description: 'Find in-depth information about S&W Foundation Contractors Inc. and our Services.',
        url: '/about'
      },
      {
        id: 2,
        title: 'Contact',
        description: 'Learn about the best ways to contact S&W Foundation Contractors Inc. we look forward to being a part of your next project!',
        url: '/contact'
      },
      {
        id: 3,
        title: 'Services',
        description: 'Discover the different drilling services S&W Foundation Contractors has to offer and learn how we can be of assistance on your future projects.',
        url: '/services'
      },
      {
        id: 4,
        title: 'Gallery',
        description: 'Instantly see photos of the equipment and rigs that we utilize here at S&W Foundation Contractors Inc.',
        url: '/gallery'
      }
    ];
  
    return data;
  }