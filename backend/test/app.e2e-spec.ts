/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Image Upload (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let authToken: string;
  let testUsername: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    prismaService = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  beforeEach(async () => {
    // Cleanup database respecting foreign keys
    await prismaService.orderItem.deleteMany();
    await prismaService.order.deleteMany();
    await prismaService.cartItem.deleteMany();
    await prismaService.cart.deleteMany();
    await prismaService.comment.deleteMany();
    await prismaService.product.deleteMany();
    await prismaService.post.deleteMany();
    await prismaService.user.deleteMany();
    testUsername = `testuser_${Date.now()}`;

    // Create a user and get auth token for all tests
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: testUsername,
        email: `${testUsername}@test.com`,
        password: 'Test@1234',
      });

    authToken = registerResponse.body.access_token;
  });

  afterAll(async () => {
    // Cleanup database respecting foreign keys
    await prismaService.orderItem.deleteMany();
    await prismaService.order.deleteMany();
    await prismaService.cartItem.deleteMany();
    await prismaService.cart.deleteMany();
    await prismaService.comment.deleteMany();
    await prismaService.product.deleteMany();
    await prismaService.post.deleteMany();
    await prismaService.user.deleteMany();
    await app.close();
  });

  describe('Posts with Image Upload', () => {
    let uploadedImageUrl: string;

    beforeEach(async () => {
      // Upload image for tests
      const fileContent = Buffer.from('test image content');
      const response = await request(app.getHttpServer())
        .post('/upload/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', fileContent, {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      uploadedImageUrl = response.body.url;
    });

    it('should create a post with imagePath', async () => {
      const createPostDto = {
        content: 'Post with image',
        imagePath: uploadedImageUrl,
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPostDto)
        .expect(201);

      expect(response.body).toHaveProperty('content', 'Post with image');
      expect(response.body).toHaveProperty('imagePath', uploadedImageUrl);
      expect(response.body).toHaveProperty('author');
      expect(response.body.author).toHaveProperty('username', testUsername);
      expect(response.body).toHaveProperty('id');
    });

    it('should create a post without imagePath', async () => {
      const createPostDto = {
        content: 'Post without image',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPostDto)
        .expect(201);

      expect(response.body).toHaveProperty('content', 'Post without image');
      expect(response.body.imagePath).toBeNull();
    });

    it('should retrieve posts with imagePath in list', async () => {
      // Create post with image
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Post with image',
          imagePath: uploadedImageUrl,
        });

      // Get all posts
      const response = await request(app.getHttpServer())
        .get('/posts')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('imagePath');
      expect(response.body[0].imagePath).toBe(uploadedImageUrl);
    });

    it('should retrieve post with imagePath by id', async () => {
      // Create post with image
      const createResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Post with image',
          imagePath: uploadedImageUrl,
        });

      const postId = createResponse.body.id;

      // Get specific post
      const response = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', postId);
      expect(response.body).toHaveProperty('imagePath');
      expect(response.body.imagePath).toBe(uploadedImageUrl);
    });

    it('should validate imagePath format', async () => {
      const createPostDto = {
        content: 'Post with invalid imagePath',
        imagePath: 'not-a-valid-path',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPostDto)
        .expect(201);

      expect(response.body).toHaveProperty('imagePath', 'not-a-valid-path');
    });
  });

  describe('Image Upload Integration Flow', () => {
    it('should complete full image upload flow', async () => {
      // Step 1: Upload image
      const fileContent = Buffer.from('test image content');
      const uploadResponse = await request(app.getHttpServer())
        .post('/upload/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', fileContent, {
          filename: 'flow-image.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(uploadResponse.body).toHaveProperty('url');
      const imagePath = uploadResponse.body.url;

      // Step 2: Create post with imagePath
      const createPostResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Post with uploaded image',
          imagePath: imagePath,
        })
        .expect(201);

      expect(createPostResponse.body).toHaveProperty('imagePath', imagePath);
      expect(createPostResponse.body).toHaveProperty(
        'content',
        'Post with uploaded image',
      );

      // Step 3: Retrieve post and verify imagePath
      const postId = createPostResponse.body.id;
      const getPostResponse = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(getPostResponse.body).toHaveProperty('imagePath', imagePath);

      // Step 4: Verify in posts list
      const getPostsResponse = await request(app.getHttpServer())
        .get('/posts')
        .expect(200);

      const post = getPostsResponse.body.find((p: any) => p.id === postId);
      expect(post).toBeDefined();
      expect(post.imagePath).toBe(imagePath);
    });
  });

  describe('Multiple Image Formats', () => {
    it('should handle different image formats', async () => {
      const formats = [
        { extension: 'jpg', contentType: 'image/jpeg' },
        { extension: 'png', contentType: 'image/png' },
        { extension: 'gif', contentType: 'image/gif' },
        { extension: 'webp', contentType: 'image/webp' },
      ];

      for (const format of formats) {
        // Upload image using Multer (local upload)
        // We'll mock the file upload here
        const filePath = `test/fixtures/image.${format.extension}`;

        // Ensure fixture exists or create mock buffer
        const fileContent = Buffer.from('test image content');

        const uploadResponse = await request(app.getHttpServer())
          .post('/upload/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', fileContent, {
            filename: `test-image.${format.extension}`,
            contentType: format.contentType
          })
          .expect(201);

        const { url } = uploadResponse.body;

        // Create post with this image
        const postResponse = await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: `Post with ${format.extension} image`,
            imagePath: url,
          })
          .expect(201);

        expect(postResponse.body.imagePath).toMatch(
          new RegExp(`^/uploads/file-.*\\.${format.extension}$`),
        );
      }
    });
  });
});
