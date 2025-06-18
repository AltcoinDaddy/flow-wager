
// Backend API for FlowWager - Next.js API Routes

// app/api/ipfs/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NFTStorage } from 'nft.storage';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const client = new NFTStorage({ 
      token: process.env.NFT_STORAGE_API_KEY! 
    });
    
    const metadata = await client.store({
      name: `FlowWager Market Image ${Date.now()}`,
      description: 'FlowWager prediction market image',
      image
    });
    
    return NextResponse.json({ 
      cid: metadata.ipnft,
      url: `https://ipfs.io/ipfs/${metadata.ipnft}`
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json(
      { error: "IPFS upload failed" },
      { status: 500 }
    );
  }
}