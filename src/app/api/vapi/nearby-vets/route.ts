// app/api/nearby-clinics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const apiKey = process.env.GOOGLE_API_KEY;

async function searchOpenClinics({ zipCode, radius }: { zipCode: string; radius?: number }) {
  const textQuery = `Emergency vet / pet clinic open now ${zipCode}`;
  const defaultRadius = 8046.72; // default to 5 miles in meters if radius not provided
  const searchRadius = (radius ? radius * 1609.34 : defaultRadius); // convert miles to meters if radius is provided

  const response = await axios.post(
    `https://places.googleapis.com/v1/places:searchText?key=${apiKey}`,
    {
      textQuery,
      openNow: true,
      locationBias: {
        circle: {
          radius: searchRadius,
        }
      }
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.location',
      },
    }
  );

  const places = response.data.places || [];

  // Map results and include location data for sorting
  const clinicInfo = places.map((place: { 
    displayName: { text: string },
    formattedAddress: string,
    rating?: number,
    userRatingCount?: number,
    internationalPhoneNumber?: string,
    location?: { lat: number, lng: number }
  }) => ({
    name: place.displayName.text,
    address: place.formattedAddress,
    rating: place.rating || 0,
    userRatingsTotal: place.userRatingCount || 0,
    phoneNumber: place.internationalPhoneNumber || '',
    location: place.location
  }));

  // Sort clinics by rating in descending order and then by proximity (if locations are available)
  clinicInfo.sort((a: { rating: number; location: { lat: number; lng: number; }; }, b: { rating: number; location: { lat: number; lng: number; }; }) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (a.location && b.location) {
      // Calculate distance approximation (placeholder example based on lat/long, not accurate distance calc)
      const distanceA = a.location.lat ** 2 + a.location.lng ** 2;
      const distanceB = b.location.lat ** 2 + b.location.lng ** 2;
      return distanceA - distanceB;
    }
    return 0;
  });

  return clinicInfo;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    console.log(message);

    if (message.type === 'function-call' && message.functionCall) {
      const { parameters } = message.functionCall;
      
      const clinics = await searchOpenClinics(parameters);
      const jsonResponse = NextResponse.json({ result: "Nearby open clinics found successfully.", clinics: clinics }, { status: 200 });
      jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
      jsonResponse.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return jsonResponse;
    } else {
      const jsonResponse = NextResponse.json({ message: `Unhandled message type: ${message.type}` }, { status: 400 });
      jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
      jsonResponse.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return jsonResponse;
    }
  } catch (error) {
    console.error('Error processing request:', error);
    const jsonResponse = NextResponse.json({ message: 'Server error: ' + JSON.stringify(error) }, { status: 500 });
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return jsonResponse;
  }
}

export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
