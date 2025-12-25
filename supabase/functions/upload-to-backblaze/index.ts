import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.525.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Backblaze credentials from environment
    const keyId = Deno.env.get('BACKBLAZE_KEY_ID');
    const applicationKey = Deno.env.get('BACKBLAZE_APPLICATION_KEY');
    const bucketName = Deno.env.get('BACKBLAZE_BUCKET_NAME');
    const endpoint = Deno.env.get('BACKBLAZE_ENDPOINT');

    if (!keyId || !applicationKey || !bucketName || !endpoint) {
      throw new Error('Backblaze credentials not configured');
    }

    // Parse request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      throw new Error('No file provided');
    }

    // Configure S3 client for Backblaze B2
    const s3Client = new S3Client({
      endpoint: `https://${endpoint}`,
      region: 'us-west-001', // Backblaze doesn't really use regions, but SDK requires it
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: applicationKey,
      },
    });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}_${randomString}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Backblaze B2
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read', // Make file publicly accessible
    });

    await s3Client.send(uploadCommand);

    // Construct public URL
    const publicUrl = `https://${endpoint}/file/${bucketName}/${fileName}`;

    console.log(`File uploaded successfully: ${publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        fileName,
        size: file.size,
        contentType: file.type,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Backblaze upload error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Upload failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
