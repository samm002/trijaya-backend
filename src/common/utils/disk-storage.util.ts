import * as fs from 'fs';
import { diskStorage } from 'multer';
import * as path from 'path';

import { generateSlug } from './generate-slug.util';

export const storage = diskStorage({
  destination: (req, file, callback) => {
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    callback(null, tmpDir);
  },
  filename: (req, file, callback) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = generateSlug(
      path.basename(file.originalname, fileExtension),
    );
    callback(null, `${fileName}${fileExtension}`);
  },
});

// In case changing to memory storage for storing temporary uploaded file
// export const storage = memoryStorage();
