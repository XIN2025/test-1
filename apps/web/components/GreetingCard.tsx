'use client';
import React from 'react';

interface GreetingCardProps {
  name: string;
}

const GreetingCard = ({ name }: GreetingCardProps) => {
  const displayName = name.split(' ')[0];
  return (
    <p className='text-xl font-bold 2xl:text-2xl'>
      Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},{' '}
      {displayName}!
    </p>
  );
};

export default GreetingCard;
