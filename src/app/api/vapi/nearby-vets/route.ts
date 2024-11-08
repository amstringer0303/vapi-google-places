// app/api/vapi/nearby-vets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const apiKey = process.env.GOOGLE_API_KEY;

// Function to search for nearby open clinics
async function searchOpenClinics({ zipCode }: { zipCode: string; }) {
  const textQuery = `Emergency vet / pet clinic open now ${zipCode}`;
  const defaultRadius = 8046.72; // default to 5 miles in meters if radius not provided
  const expandedRadius = defaultRadius * 2; // expanded radius to 10 miles

  const fetchClinics = async (radius: number) => {
    const response = await axios.post(
      `https://places.googleapis.com/v1/places:searchText?key=${apiKey}`,
      {
        textQuery,
        openNow: true,
        locationBias: {
          circle: {
            radius,
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

    return response.data.places || [];
  };

  // Fetch clinics with default radius
  let places = await fetchClinics(defaultRadius);

  // If less than 2 results, fetch again with expanded radius and append
  if (places.length < 2) {
    const additionalPlaces = await fetchClinics(expandedRadius);
    places = places.concat(additionalPlaces);
  }

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


// API endpoint for Vapi to get nearby open clinics
export async function POST(request: NextRequest) {

  try {
    // Parse the request body only once
    const body = await request.json();
    console.log(JSON.stringify(body, null, 2));
    const toolCallId = body.message.toolCalls[0].id;
    console.log(toolCallId);
    let parameters = body.message.toolCalls[0].function.arguments;
    // If parameters is a string, parse it as JSON
    if (typeof parameters === 'string') {
      parameters = JSON.parse(parameters);
    }
    // Validate zipCode in parameters
    if (!parameters || typeof parameters.zipCode !== 'string') {
      return NextResponse.json(
        { message: 'Invalid or missing parameters: zipCode is required.'},
        { status: 400 }
      );
    }
    // Extract zipCode from parameters passed by Vapi using getPetClinics tool
    const zipCode = parameters.zipCode;
    console.log(zipCode);
    // Call function above to get nearby open clinics
    const clinics = await searchOpenClinics(zipCode);
    console.log(clinics);
    // Format response to be returned to Vapi (exact format as specified in Vapi Documentation)
    const response = {
      results: [
        {
          toolCallId: toolCallId,
          result: {
            message: "Nearby open clinics found successfully. " + JSON.stringify(clinics),
          },
        },
      ],
    };
    // Return response to Vapi
    const jsonResponse = NextResponse.json(response, { status: 200 });
    // Allow requests from any origin - Do Not Remove
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return jsonResponse;
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
