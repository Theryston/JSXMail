import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import calculateHash from 'src/utils/calculate-hash';
import { MAX_FILE_SIZE, MAXIMUM_STORAGE } from 'src/utils/constants';
import { fileSelect } from 'src/utils/public-selects';
import { S3ClientService } from './s3-client.service';
import { formatSize } from 'src/utils/format';

@Injectable()
export class UploadFileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3ClientService: S3ClientService,
  ) {}

  async execute(file: Express.Multer.File, userId: string) {
    if (!file.originalname) {
      throw new HttpException('File name is required', HttpStatus.BAD_REQUEST);
    }

    if (!file.buffer) {
      throw new HttpException(
        'File buffer is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!file.mimetype) {
      throw new HttpException(
        'File mimetype is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new HttpException('File size is too large', HttpStatus.BAD_REQUEST);
    }

    const {
      _sum: { size: storage },
    } = await this.prisma.file.aggregate({
      where: {
        deletedAt: null,
        userId,
      },
      _sum: {
        size: true,
      },
    });

    if (storage + file.size > MAXIMUM_STORAGE) {
      throw new HttpException(
        `You have reached the maximum storage limit of ${formatSize(MAXIMUM_STORAGE)}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const hash = calculateHash(file.buffer);

    const fileAlreadyExists = await this.prisma.file.findFirst({
      where: {
        hash,
        userId: user.id,
        deletedAt: null,
      },
      select: fileSelect,
    });

    if (fileAlreadyExists) {
      return fileAlreadyExists;
    }

    let ext =
      file.originalname.split('.').length > 1
        ? file.originalname.split('.').pop()
        : undefined;

    const key = `${user.id}/${new Date().getTime()}.${ext ? ext : file.mimetype.split('/')[1]}`;

    const url = await this.s3ClientService.putObject({
      key,
      body: file.buffer,
      mimetype: file.mimetype,
    });

    const createdFile = await this.prisma.file.create({
      data: {
        encoding: file.encoding,
        key,
        mimeType: file.mimetype,
        originalName: file.originalname,
        size: file.size,
        userId: user.id,
        hash,
        url,
      },
      select: fileSelect,
    });

    return createdFile;
  }
}
