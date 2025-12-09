#set enum(numbering: "a)")

= Dokumentasi Tugas PBKK 8

#v(0.3cm)

Juang Maulana Taruna Putra

NRP: 5025231257

#v(0.5cm)

== 1. Multer

=== a. Module
```ts
imports: [
    // TODO
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const timeStamp = Date.now();
          const originalName = file.originalname.replace(/\s+/g, '-');
          const fileExtension = extname(originalName);
          cb(null, `${file.fieldname}-${timeStamp}${fileExtension}`);
        }
      }),
      limits: {fileSize: 5 * 1024 * 1024}, 
      fileFilter: function(_req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if(mimetype && extname){
            return cb(null, true); 
        } else {
            cb(new BadRequestException('Only image files are allowed'), false);
        }
      },
    }),
  ],
```
Terapkan setting/konfigurasi multer pada module dengan konfigurasi tempat penyimpanan yaitu pada folder uploads, serta atur konfigurasi untuk filename yang terdiri dari penggabungan waktu saat file diuplaod, nama asli, serta extension dari file tersebut. Selain itu, limit file size menjadi 5 MB. Terakhir, lakukan filter sehingga jenis file yang diterima adalah extension gambar seperti jpg, webp, png, dan lain-lain. 


#line(length: 100%)

=== b. Controller
```ts
@Controller('upload')
export class UploadController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    // TODO
    if (!file) {
      return { imagePath: null };
    }
    const imagePath = file.filename;
    console.log(file);
    return { imagePath };
  }
}
```
Gunakan file interceptor dari Multer untuk image, untuk dilakukan proses pengecekan dari multer terlebih dahulu. Lalu, jika file kosong, maka return imagePath : null. Jika file tidak kosong, maka isi image path dengan nama file dan return nama file tersebut.

#line(length: 100%)

=== Screenshot Pass All Test Multer
#image("multer-test.png")

#line(length: 100%)

== 2. AWS S3

=== a. Environment Setup
#image("bucket.png")
Buat bucket S3 AWS dan copy REGION tempat bucket dibuat
#image("access-key.png")
Setelah itu, buat Access Key di bagian security credential akun, dan copy dan paste access key serta bucket credentials ke file .env
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# S3 Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID= access-key-name 
AWS_SECRET_ACCESS_KEY= secret-key
S3_ENDPOINT=s3://e08-pbkk-bucket 
S3_BUCKET_NAME=e08-pbkk-bucket
S3_PUBLIC_URL=s3://arn:aws:s3:ap-southeast-1:145805628969:accesspoint/public-ap
```

#line(length: 100%)

=== b. Service
```ts
  async generatePresignedUrl(
    fileExtension: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; imagePath: string }> {
    // TODO
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.S3_BUCKET_NAME;
```
Deklarasikan variabel-variabel yang ada di env untuk digunakan nantinya

```ts
    const s3 = new S3({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
```
Buat S3 baru sesuai region bucket sesuai kredensial dan region yang ada

```ts
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const key = `posts/${timestamp}-${randomString}.${fileExtension}`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
    return { uploadUrl, imagePath: key };
  } 
}
```
Nyatakan waktu waktu sekarang serta random string untuk penamaan file, lalu construct command dengan PutObjectCommand dengan value bucket, key, dan content type. Setelah itu, buat preSignedUrl dan return uploadUrl dan imagePathnya.

=== c. Controller
```ts
  async generatePresignedUrl(@Body() dto: GeneratePresignedUrlDto) {
    // TODO
    const { uploadUrl, imagePath } = await this.s3Service.generatePresignedUrl(
      dto.fileExtension,
      dto.contentType,
    );
    return { uploadUrl, imagePath };
```
Nyatakan uploadUrl dan imagepath dari s3Service generate presignedUrl dengan value dto yang sudah dibuat. Lalu, return uploadUrl dan imagePathnya.

=== Screenshot Pass All Tests AWS S3
#image("s3-test.png")

== Perbandingan Multer vs AWS S3 
Menurut saya, AWS S3 lebih baik daripada multer, karena AWS S3 merupakan cloud service sehingga beban pada server hosting tidak terlalu berat karena seluruh file uploads diserahkan kepada pihak ketiga. Selain itu, AWS S3 lebih aman karena terpisah dari server file, sehingga kerentantan server terhadap file injection bisa lebih mudah diatasi. Namun, untuk pengapilasian kode, Multer masih lebih mudah karena tidak perlu membuat service, hanya memerlukan controller dan module saja. Tapi, secara keseluruhan AWS S3 lebih ideal digunakan. 