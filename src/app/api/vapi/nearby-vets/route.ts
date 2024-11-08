// app/api/nearby-clinics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const apiKey = process.env.GOOGLE_API_KEY;

async function searchOpenClinics({ zipCode, radius }: { zipCode: string; radius?: number }) {
  const textQuery = `Emergency vet / pet clinic open now ${zipCode}`;
  const defaultRadius = 8046.72; // default to 5 miles in meters if radius not provided
  const searchRadius = radius ? radius * 1609.34 : defaultRadius; // convert miles to meters if radius is provided

  const response = await axios.post(
    `https://places.googleapis.com/v1/places:searchText?key=${apiKey}`,
    {
      textQuery,
      openNow: true,
      locationBias: {
        circle: {
          radius: searchRadius,
        },
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.location',
      },
    }
  );

  const places = response.data.places || [];

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
    location: place.location,
  }));

  // Sort clinics by rating in descending order and then by proximity (if locations are available)
  clinicInfo.sort((a: { rating: number; location: { lat: number; lng: number; }; }, b: { rating: number; location: { lat: number; lng: number; }; }) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (a.location && b.location) {
      const distanceA = a.location.lat ** 2 + a.location.lng ** 2;
      const distanceB = b.location.lat ** 2 + b.location.lng ** 2;
      return distanceA - distanceB;
    }
    return 0;
  });

  return clinicInfo;
}

export async function POST(request: NextRequest) {
  let toolCallId;

  try {
    // Parse the request body only once
    const body = await request.json();
    console.log(JSON.stringify(body, null, 2));
    toolCallId = body.toolCallId;
    const { parameters } = body;
    console.log(JSON.stringify(parameters, null, 2));

    // Check if parameters are defined and contain zipCode
    if (!parameters || typeof parameters.zipCode !== 'string') {
      return NextResponse.json(
        { message: 'Invalid or missing parameters: zipCode is required.', toolCallId },
        { status: 400 }
      );
    }

    const clinics = await searchOpenClinics(parameters);

    const response = {
      toolCallId,
      result: {
        message: "Nearby open clinics found successfully.",
        clinics: clinics,
      },
    };

    const jsonResponse = NextResponse.json(response, { status: 200 });
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return jsonResponse;
  } catch (error) {
    console.error('Error processing request:', error);

    const errorResponse = {
      message: 'Server error: ' + JSON.stringify(error),
      toolCallId: toolCallId || 'unknown',
    };

    const jsonResponse = NextResponse.json(errorResponse, { status: 500 });
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
