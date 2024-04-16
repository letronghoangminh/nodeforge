import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthorizeUrlModel {
  @Expose()
  @ApiProperty({ type: String })
  url: string;
}

export class GithubProfileModel {
  @Expose()
  @ApiProperty({ type: Number })
  id: number;

  @Expose()
  @ApiProperty({ type: Number })
  installationId: number;
}

export class GithubRepositoryModel {
  @Expose()
  @ApiProperty({ type: String })
  name: string;

  @Expose()
  @ApiProperty({ type: String })
  fullName: string;

  @Expose()
  @ApiProperty({ type: String })
  url: string;

  @Expose()
  @ApiProperty({ type: String })
  ownerName: string;
}

export class GithubBranchModel {
  @Expose()
  @ApiProperty({ type: String })
  name: string;
}
