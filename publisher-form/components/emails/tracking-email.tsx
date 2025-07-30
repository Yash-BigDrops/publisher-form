import * as React from 'react';

type OfferDetails = {
  network_offer_id: string;
  name: string;
  thumbnail_url: string;
};

interface TrackingEmailProps {
  trackingLink: string;
  contactName: string;
  offerDetails?: OfferDetails | null;
}

export const TrackingEmail: React.FC<Readonly<TrackingEmailProps>> = ({
  trackingLink,
  contactName,
  offerDetails,
}) => (
  <div style={{ fontFamily: 'sans-serif', lineHeight: '1.6', color: '#333' }}>
    <h1>Your Submission Was Successful!</h1>
    <p>
      Hello {contactName},
    </p>
    <p>
      Thank you for your submission. We have received it and will begin our review process.
    </p>

    {offerDetails && (
      <div style={{ border: '1px solid #eee', borderRadius: '5px', padding: '15px', margin: '20px 0' }}>
        <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Submission Summary</h2>
        <p style={{ margin: '10px 0' }}><strong>Offer ID:</strong> {offerDetails.network_offer_id}</p>
        <p style={{ margin: '10px 0' }}><strong>Offer Name:</strong> {offerDetails.name}</p>
        {offerDetails.thumbnail_url && (
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <img src={offerDetails.thumbnail_url} alt="Offer Thumbnail" style={{ maxWidth: '100%', borderRadius: '5px' }} />
          </div>
        )}
      </div>
    )}

    <p>
      You can use the link below to track the status of your submission. Please save it for your records.
    </p>
    <div style={{ margin: '20px 0', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
      <a
        href={trackingLink}
        style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 'bold' }}
      >
        {trackingLink}
      </a>
    </div>
    <p>
      Thank you,
      <br />
      The Big Drops Marketing Team
    </p>
  </div>
);