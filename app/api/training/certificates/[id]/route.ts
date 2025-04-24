import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/training/certificates/[id] - Generate certificate
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const { id: progressId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the progress record
    const progress = await prisma.trainingProgress.findUnique({
      where: { id: progressId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        module: true,
      },
    });

    if (!progress) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Verify ownership or admin access
    if (progress.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized to access this certificate' },
        { status: 403 }
      );
    }

    // Verify the module was completed
    if (progress.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Module not completed' }, { status: 400 });
    }

    // In a real application, here you would generate a PDF certificate
    // For this example, we'll just return the certificate data
    const certificateData = {
      id: progressId,
      moduleName: progress.module.title,
      userName: progress.user.name,
      userEmail: progress.user.email,
      completedAt: progress.completedAt,
      issueDate: new Date(),
    };

    // Update progress with certificate info if not already issued
    if (!progress.certificateIssued) {
      await prisma.trainingProgress.update({
        where: { id: progressId },
        data: {
          certificateIssued: true,
          certificateUrl: `/api/training/certificates/${progressId}`,
        },
      });
    }

    // Return simulated HTML for the certificate
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Training Certificate</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .certificate {
            width: 800px;
            padding: 40px;
            margin: 50px auto;
            background-color: white;
            border: 1px solid #ddd;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            text-align: center;
          }
          .header {
            font-size: 30px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
          }
          .subheader {
            font-size: 22px;
            color: #555;
            margin-bottom: 40px;
          }
          .name {
            font-size: 28px;
            font-weight: bold;
            margin: 30px 0;
            color: #333;
          }
          .course {
            font-size: 20px;
            margin: 20px 0;
            color: #444;
          }
          .date {
            font-size: 18px;
            margin: 30px 0;
            color: #666;
          }
          .signature {
            margin-top: 60px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">Certificate of Completion</div>
          <div class="subheader">This certifies that</div>
          <div class="name">${certificateData.userName}</div>
          <div class="subheader">has successfully completed</div>
          <div class="course">${certificateData.moduleName}</div>
          <div class="date">
            Completed on ${
              certificateData.completedAt
                ? new Date(certificateData.completedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'
            }
          </div>
          <div class="signature">
            <div>___________________________</div>
            <div>Training Administrator</div>
          </div>
        </div>
      </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}
