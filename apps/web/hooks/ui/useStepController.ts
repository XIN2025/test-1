'use client';
import { useState } from 'react';

export function useStepController(initialStep = 0) {
  const [step, setStep] = useState(initialStep);

  const next = () => setStep((prev) => prev + 1);
  const prev = () => setStep((prev) => (prev > 0 ? prev - 1 : 0));
  const reset = () => setStep(initialStep);

  return { step, setStep, next, prev, reset };
}
