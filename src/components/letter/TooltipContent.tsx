/**
 * Tooltip Content Components
 * Reusable tooltip content for form fields
 */

import React from 'react';

export function SSICTooltipContent() {
  return (
    <div>
      <p className="font-bold mb-2">Standard Subject Identification Code (SSIC)</p>
      <p className="mb-2">
        A 4-5 digit code that categorizes the subject matter of naval correspondence.
        SSICs help organize and file letters by topic.
      </p>
      <p className="mb-2 font-semibold">How to choose:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li><strong>1000-1999:</strong> Military Personnel</li>
        <li><strong>3000-3999:</strong> Operations & Readiness</li>
        <li><strong>4000-4999:</strong> Logistics</li>
        <li><strong>5000-5999:</strong> General Admin & Management</li>
        <li><strong>6000-6999:</strong> Medicine & Dentistry</li>
      </ul>
      <p className="mt-2 italic text-xs">
        💡 Use the search box above to find the right SSIC by subject matter.
      </p>
    </div>
  );
}

export function OriginatorCodeTooltipContent() {
  return (
    <div>
      <p className="font-bold mb-2">Originator&apos;s Code</p>
      <p className="mb-2">
        Identifies the office or section creating the letter.
      </p>
      <p className="mb-2 font-semibold">Common codes:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li><strong>G-1 / S-1:</strong> Administration & Personnel</li>
        <li><strong>G-2 / S-2:</strong> Intelligence</li>
        <li><strong>G-3 / S-3:</strong> Operations & Training</li>
        <li><strong>G-4 / S-4:</strong> Logistics</li>
        <li><strong>G-6 / S-6:</strong> Communications</li>
      </ul>
      <p className="mt-2 text-xs italic">
        💡 Use &quot;G-&quot; for General Staff, &quot;S-&quot; for Special Staff
      </p>
    </div>
  );
}
