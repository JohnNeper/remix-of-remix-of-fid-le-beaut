import { Client } from '@/types';

export interface ParsedContact {
  id: string;
  nom: string;
  telephone: string;
  exists: boolean;
  selected: boolean;
}

export function cleanPhone(num: string): string {
  return num.replace(/\D/g, '');
}

export function phonesMatch(phone1: string, phone2: string): boolean {
  const p1 = cleanPhone(phone1);
  const p2 = cleanPhone(phone2);
  if (!p1 || !p2) return false;
  if (p1.length < 8 || p2.length < 8) {
    return p1 === p2;
  }
  return p1.slice(-9) === p2.slice(-9);
}

export function checkPhoneExists(phoneNum: string, clients: Client[]): boolean {
  const pClean = cleanPhone(phoneNum);
  if (pClean.length < 8) return false;
  const last9 = pClean.slice(-9);

  return clients.some(c => {
    const dbClean = cleanPhone(c.telephone);
    return dbClean.length >= 8 && dbClean.slice(-9) === last9;
  });
}

export function parseVcfText(content: string, clients: Client[]): ParsedContact[] {
  const vcards = content.split('BEGIN:VCARD');
  const list: ParsedContact[] = [];
  const phoneSet = new Set<string>();

  for (const vcard of vcards) {
    if (!vcard.includes('END:VCARD')) continue;

    let name = '';
    const fnMatch = vcard.match(/^FN:(.*)$/m);
    if (fnMatch) {
      name = fnMatch[1].trim();
    } else {
      const nMatch = vcard.match(/^N:([^;]*);([^;]*)/m);
      if (nMatch) {
        name = `${nMatch[2]} ${nMatch[1]}`.trim();
      }
    }

    // Find all TEL rows and parse
    const telMatches = vcard.matchAll(/^TEL[^:]*:(.*)$/gm);
    let phone = '';
    for (const match of telMatches) {
      const p = match[1].replace(/[^\d+]/g, '');
      if (p.length >= 8) {
        phone = p;
        break;
      }
    }

    if (!name && phone) {
      name = `Contact ${phone}`;
    }

    if (name && phone) {
      const normPhone = cleanPhone(phone).slice(-9);
      if (!phoneSet.has(normPhone)) {
        phoneSet.add(normPhone);
        const exists = checkPhoneExists(phone, clients);
        list.push({
          id: Math.random().toString(36).substr(2, 9),
          nom: name,
          telephone: phone,
          exists,
          selected: !exists,
        });
      }
    }
  }
  return list;
}

export function parseGenericText(text: string, clients: Client[]): ParsedContact[] {
  const lines = text.split('\n');
  const list: ParsedContact[] = [];
  const phoneSet = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Extract phone number pattern (at least 8 numbers, can contain spaces, dots, dashes, +)
    const phoneMatch = trimmed.match(/(?:\+?\d[\s.-]*){8,15}/);
    if (phoneMatch) {
      const rawPhone = phoneMatch[0];
      const cleanPhoneNum = rawPhone.replace(/[^\d+]/g, '');
      
      let name = trimmed.replace(rawPhone, '').replace(/[,;\t-]/g, ' ').trim();
      name = name.replace(/\s+/g, ' '); // collapse spaces
      
      if (!name) {
        name = `Contact ${cleanPhoneNum}`;
      }

      if (cleanPhoneNum.length >= 8) {
        const normPhone = cleanPhone(cleanPhoneNum).slice(-9);
        if (!phoneSet.has(normPhone)) {
          phoneSet.add(normPhone);
          const exists = checkPhoneExists(cleanPhoneNum, clients);
          list.push({
            id: Math.random().toString(36).substr(2, 9),
            nom: name,
            telephone: cleanPhoneNum,
            exists,
            selected: !exists,
          });
        }
      }
    }
  }
  return list;
}
