// app/api/vet-clinics/route.ts
import { NextResponse } from 'next/server';

interface ClinicInfo {
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  phoneNumber?: string;
}

interface ClinicsResponse {
  clinics: ClinicInfo[];
}

interface ErrorResponse {
  error: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get('zipCode');
  const apiKey = process.env.GOOGLE_API_KEY;
  const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius') as string) * 1609.34 : 8046.72; // convert miles to meters

  if (!zipCode || !apiKey) {
    const errorResponse: ErrorResponse = { error: 'USA Zip code of the caller is required. Please specify zipCode parameter.' };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  // Google Places Text Search API with text query
  const textQuery = `Emergency vet / pet clinic open now ${zipCode}`;
  const endpoint = `https://places.googleapis.com/v1/places:searchText`;

  const requestBody = {
    textQuery: textQuery,
    openNow: true,
    locationBias: {
      circle: {
        radius: radius,
        center: { latitude: 0, longitude: 0 }  // Placeholder: You may want to use location-based search here
      }
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.internationalPhoneNumber',
      }),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorResponse: ErrorResponse = { error: 'Failed to fetch vet clinics' };
      return NextResponse.json(errorResponse, { status: response.status });
    }

    const data = await response.json();
    const places = data.places || [];

    const clinicInfo: ClinicInfo[] = places.map((place: { displayName: { text: string }, formattedAddress: string, rating?: number, userRatingCount?: number, internationalPhoneNumber?: string }) => ({
      name: place.displayName.text,
      address: place.formattedAddress,
      rating: place.rating,
      userRatingsTotal: place.userRatingCount,
      phoneNumber: place.internationalPhoneNumber,
    }));

    const clinicsResponse: ClinicsResponse = { clinics: clinicInfo };
    return NextResponse.json(clinicsResponse);

  } catch (error) {
    const errorResponse: ErrorResponse = { error: 'Server error: ' + JSON.stringify(error) };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}