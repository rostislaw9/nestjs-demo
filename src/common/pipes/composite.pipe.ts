import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class CompositePipe implements PipeTransform {
  constructor(private readonly pipes: PipeTransform[]) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    let result = value;
    for (const pipe of this.pipes) {
      result = await pipe.transform(result, metadata);
    }
    return result;
  }
}
