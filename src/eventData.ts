

import { SpaceEvent, EventType } from './types';

export const spaceEvents: SpaceEvent[] = [
  {
    id: 'apollo11',
    title: 'Apollo 11 Moon Landing',
    description: 'First humans land on the Moon',
    date: new Date('1969-07-20T20:17:00Z'),
    eventType: EventType.Landing,
    location: { bodyId: 'earth' },
    mission: 'Apollo 11',
    imageUrl: '/images/apollo11.jpg',
    documentChunkIds: ['chunk_apollo_001', 'chunk_apollo_002'],
  },
  {
    id: 'voyager1_launch',
    title: 'Voyager 1 Launch',
    description: 'Launch of Voyager 1 spacecraft',
    date: new Date('1977-09-05'),
    eventType: EventType.Launch,
    location: { bodyId: 'earth' },
    mission: 'Voyager',
  },
  {
    id: 'cassini_saturn',
    title: 'Cassini Enters Saturn Orbit',
    description: 'Cassini spacecraft begins orbiting Saturn',
    date: new Date('2004-07-01'),
    eventType: EventType.Milestone,
    location: { bodyId: 'saturn' },
    mission: 'Cassini-Huygens',
  },
  {
    id: 'perseverance_landing',
    title: 'Perseverance Rover Landing',
    description: 'NASA Mars 2020 Perseverance rover lands in Jezero Crater',
    date: new Date('2021-02-18'),
    eventType: EventType.Landing,
    location: { bodyId: 'mars' },
    mission: 'Mars 2020',
  },
  {
    id: 'shoemaker_levy',
    title: 'Comet Shoemaker-Levy 9 Impact',
    description: 'Comet fragments collide with Jupiter',
    date: new Date('1994-07-16'),
    eventType: EventType.Collision,
    location: { bodyId: 'jupiter' },
  },
];

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