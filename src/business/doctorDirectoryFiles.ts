import { unifiedRequest } from './unifiedClient';
import { getFile } from '../sales/files';
import type { Attachment } from '../sales/model';
/** Archive real browser-uploaded proof before submitting to the shared review directory. */
export async function archiveDoctorFiles(owner: string, files: Attachment[]): Promise<Attachment[]> {
    return Promise.all(files.map(async (file) => {
        if (file.storage === 'directory' || file.storage === 'invitation')
            return file;
        const blob = await getFile(owner, file);
        const content = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(Error('无法读取资质文件。')); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.readAsDataURL(blob); });
        return unifiedRequest<Attachment>('doctor-upload', { file: { name: file.name, type: file.type, category: file.category, content } });
    }));
}
