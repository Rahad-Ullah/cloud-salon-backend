import { registerApiRoute } from '../../../helpers/openapi-helper';
import { MediaUploadValidations } from './mediaUpload.validation';

export function registerMediaUploadDocs() {
  const registerMediaUpload = (
    opts: Parameters<typeof registerApiRoute>[0],
  ) => {
    registerApiRoute({ tags: ['MediaUpload'], ...opts });
  };

  // upload media
  registerMediaUpload({
    method: 'post',
    path: '/media-uploads/upload',
    summary: 'Upload media',
    body: MediaUploadValidations.uploadMedia.shape.body,
    isAuth: true,
  });
}
