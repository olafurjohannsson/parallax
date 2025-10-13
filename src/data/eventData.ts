import { SpaceEvent, EventType } from './types';

// Complete Apollo 11 event with all details
export const apollo11Event: SpaceEvent = {
  id: 'apollo11',
  title: 'Apollo 11 Moon Landing',
  description: 'First crewed mission to land on the Moon. Neil Armstrong and Buzz Aldrin spent 21.5 hours on the lunar surface while Michael Collins orbited above.',
  date: new Date('1969-07-20T20:17:40Z'),
  eventType: EventType.Landing,
  mission: 'Apollo 11',
  
  location: {
    bodyId: 'moon',
    coords: { lat: 0.6875, lon: 23.4333 } // Sea of Tranquility
  },
  
  crew: [
    'Neil Armstrong (Commander)',
    'Buzz Aldrin (Lunar Module Pilot)',
    'Michael Collins (Command Module Pilot)'
  ],
  
  duration: '21 hours 36 minutes on surface',
  
  significance: [
    'First humans to walk on the Moon',
    'Collected 21.55 kg of lunar samples',
    'Deployed scientific instruments',
    'Proved capability for future lunar exploration',
  ],
  
  media: {
    images: [
      {
        url: 'https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~large.jpg',
        nasaId: 'as11-40-5903',
        title: 'Buzz Aldrin and US Flag',
        description: 'Astronaut Buzz Aldrin poses for a photograph beside the deployed United States flag during the Apollo 11 EVA.',
        credit: 'NASA/Neil Armstrong',
        dateCreated: '1969-07-20',
        thumbnail: 'https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~thumb.jpg',
      },
    ],
    
    models3D: [
      {
        url: 'https://science.nasa.gov/3d-resources/apollo-11-command-module/',
        nasaId: 'apollo-11-cm',
        title: 'Apollo 11 Command Module',
        format: 'glb',
        thumbnail: '/images/apollo11_cm_thumb.jpg',
      },
    ],
    
    audio: [
      {
        url: 'https://www.nasa.gov/62284main_onesmall2.wav',
        title: 'First Words from the Moon',
        transcript: '"That\'s one small step for man, one giant leap for mankind." - Neil Armstrong',
      },
    ],
  },
  
  relatedEvents: ['apollo11_launch', 'apollo11_eva', 'apollo11_return'],
};

// Main events array
export const spaceEvents: SpaceEvent[] = [
  apollo11Event,
  
  {
    id: 'apollo11_launch',
    title: 'Apollo 11 Launch',
    description: 'Launch of Saturn V rocket carrying the Apollo 11 crew from Kennedy Space Center.',
    date: new Date('1969-07-16T13:32:00Z'),
    eventType: EventType.Launch,
    mission: 'Apollo 11',
    location: {
      bodyId: 'earth',
      coords: { lat: 28.6081, lon: -80.6041 } // Kennedy Space Center
    },
    crew: apollo11Event.crew,
    significance: [
      'Start of the historic Moon landing mission',
      'Perfect launch with no technical issues',
    ],
  },
  
  {
    id: 'sputnik1',
    title: 'Sputnik 1 Launch',
    description: 'First artificial satellite launched into Earth orbit, beginning the Space Age.',
    date: new Date('1957-10-04T19:28:34Z'),
    eventType: EventType.Launch,
    mission: 'Sputnik 1',
    location: {
      bodyId: 'earth',
      coords: { lat: 45.92, lon: 63.342 } // Baikonur
    },
    significance: [
      'First artificial satellite in orbit',
      'Started the Space Race',
      'Transmitted radio signals for 21 days',
    ],
  },
  
  {
    id: 'yuri_gagarin',
    title: 'First Human in Space',
    description: 'Yuri Gagarin becomes the first human to journey into outer space.',
    date: new Date('1961-04-12T06:07:00Z'),
    eventType: EventType.Milestone,
    mission: 'Vostok 1',
    location: {
      bodyId: 'earth',
      coords: { lat: 45.92, lon: 63.342 }
    },
    crew: ['Yuri Gagarin (Pilot)'],
    duration: '108 minutes',
    significance: [
      'First human spaceflight',
      'Completed one orbit of Earth',
      'Reached altitude of 327 km',
    ],
  },
  
  {
    id: 'mars_pathfinder',
    title: 'Mars Pathfinder Landing',
    description: 'First successful rover mission to Mars, deploying Sojourner rover.',
    date: new Date('1997-07-04T16:56:55Z'),
    eventType: EventType.Landing,
    mission: 'Mars Pathfinder',
    location: {
      bodyId: 'mars',
      coords: { lat: 19.13, lon: -33.22 } // Ares Vallis
    },
    significance: [
      'First successful Mars rover',
      'Demonstrated low-cost landing and roving technology',
      'Analyzed Martian rocks and atmosphere',
    ],
  },
  
  {
    id: 'voyager1_launch',
    title: 'Voyager 1 Launch',
    description: 'Launch of Voyager 1 spacecraft on its Grand Tour of the outer planets.',
    date: new Date('1977-09-05T12:56:00Z'),
    eventType: EventType.Launch,
    mission: 'Voyager 1',
    location: {
      bodyId: 'earth',
      coords: { lat: 28.5, lon: -80.5 } // Cape Canaveral
    },
    significance: [
      'Most distant human-made object',
      'First to enter interstellar space',
      'Still operational after 45+ years',
    ],
  },
  
  {
    id: 'hubble_launch',
    title: 'Hubble Space Telescope Launch',
    description: 'Space Shuttle Discovery carries Hubble Space Telescope to orbit.',
    date: new Date('1990-04-24T12:33:51Z'),
    eventType: EventType.Launch,
    mission: 'STS-31',
    location: {
      bodyId: 'earth',
      coords: { lat: 28.5, lon: -80.5 }
    },
    crew: [
      'Loren Shriver (Commander)',
      'Charles Bolden (Pilot)',
      'Bruce McCandless II',
      'Kathryn Sullivan',
      'Steven Hawley',
    ],
    significance: [
      'Revolutionary space telescope deployment',
      'Transformed our understanding of the universe',
      'Still operational after 30+ years',
    ],
  },
  
  {
    id: 'apollo13',
    title: 'Apollo 13 Incident',
    description: '"Houston, we\'ve had a problem" - Oxygen tank explosion forces mission abort.',
    date: new Date('1970-04-13T03:07:53Z'),
    eventType: EventType.Milestone,
    mission: 'Apollo 13',
    location: {
      bodyId: 'earth', // They were heading to moon but returned
    },
    crew: [
      'Jim Lovell (Commander)',
      'Jack Swigert (Command Module Pilot)',
      'Fred Haise (Lunar Module Pilot)',
    ],
    significance: [
      'Successful failure - crew returned safely',
      'Demonstrated NASA problem-solving capabilities',
      'Led to significant safety improvements',
    ],
  },
  
  {
    id: 'iss_first_module',
    title: 'ISS First Module Launch',
    description: 'Zarya, the first module of the International Space Station, launches.',
    date: new Date('1998-11-20T06:40:00Z'),
    eventType: EventType.Launch,
    mission: 'ISS Assembly',
    location: {
      bodyId: 'earth',
      coords: { lat: 45.92, lon: 63.342 }
    },
    significance: [
      'Beginning of ISS construction',
      'International cooperation in space',
      'Continuous human presence in space since 2000',
    ],
  },
  
  {
    id: 'curiosity_landing',
    title: 'Curiosity Rover Landing',
    description: 'Mars Science Laboratory successfully lands Curiosity rover using sky crane.',
    date: new Date('2012-08-06T05:17:57Z'),
    eventType: EventType.Landing,
    mission: 'Mars Science Laboratory',
    location: {
      bodyId: 'mars',
      coords: { lat: -4.5895, lon: 137.4417 } // Gale Crater
    },
    significance: [
      'Largest rover sent to Mars',
      'Revolutionary sky crane landing system',
      'Found evidence of ancient water on Mars',
    ],
  },
  
  {
    id: 'new_horizons_pluto',
    title: 'New Horizons Pluto Flyby',
    description: 'First spacecraft to explore Pluto, providing detailed images and data.',
    date: new Date('2015-07-14T11:49:57Z'),
    eventType: EventType.Flyby,
    mission: 'New Horizons',
    location: {
      bodyId: 'neptune', // Pluto not in our system, using Neptune as reference
    },
    significance: [
      'First close-up images of Pluto',
      'Discovered geological activity on Pluto',
      'Revealed complex atmosphere and moons',
    ],
  },
  
  {
    id: 'spacex_crew_dragon',
    title: 'First Commercial Crew Launch',
    description: 'SpaceX Crew Dragon carries NASA astronauts to ISS, first commercial human spaceflight.',
    date: new Date('2020-05-30T19:22:45Z'),
    eventType: EventType.Launch,
    mission: 'Crew Dragon Demo-2',
    location: {
      bodyId: 'earth',
      coords: { lat: 28.5729, lon: -80.6490 }
    },
    crew: [
      'Doug Hurley (Commander)',
      'Bob Behnken (Joint Operations Commander)',
    ],
    significance: [
      'First commercial human spaceflight',
      'Returned human launch capability to US',
      'New era of commercial space transportation',
    ],
  },
  
  {
    id: 'perseverance_landing',
    title: 'Perseverance Rover Landing',
    description: 'NASA\'s Perseverance rover and Ingenuity helicopter land on Mars.',
    date: new Date('2021-02-18T20:55:00Z'),
    eventType: EventType.Landing,
    mission: 'Mars 2020',
    location: {
      bodyId: 'mars',
      coords: { lat: 18.4447, lon: 77.4508 } // Jezero Crater
    },
    significance: [
      'First Mars helicopter (Ingenuity)',
      'Collecting samples for future return',
      'Advanced life-detection instruments',
    ],
  },
  
  {
    id: 'jwst_launch',
    title: 'James Webb Space Telescope Launch',
    description: 'Launch of the most powerful space telescope ever built.',
    date: new Date('2021-12-25T12:20:00Z'),
    eventType: EventType.Launch,
    mission: 'JWST',
    location: {
      bodyId: 'earth',
      coords: { lat: 5.232, lon: -52.768 } // French Guiana
    },
    significance: [
      'Most powerful space telescope',
      'Observing earliest galaxies',
      'Revolutionizing astronomy',
    ],
  },
];

// Fixed helper functions
export function getEventsInRange(startDate: Date, endDate: Date): SpaceEvent[] {
  return spaceEvents.filter(
    event => event.date >= startDate && event.date <= endDate
  );
}

export function getEventsForBody(bodyId: string): SpaceEvent[] {
  return spaceEvents.filter(
    event => event.location?.bodyId === bodyId
  );
}

// Get upcoming events relative to a date
export function getUpcomingEvents(currentDate: Date, days: number = 30): SpaceEvent[] {
  const endDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);
  return spaceEvents
    .filter(event => event.date > currentDate && event.date <= endDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Get past events relative to a date
export function getPastEvents(currentDate: Date, days: number = 30): SpaceEvent[] {
  const startDate = new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000);
  return spaceEvents
    .filter(event => event.date >= startDate && event.date < currentDate)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}