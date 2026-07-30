import { describe, it, expect } from 'vitest';
import { cleanPhone, phonesMatch, checkPhoneExists, parseVcfText, parseGenericText } from '../utils/phone';
import { Client } from '../types';

describe('Phone Utilities', () => {
  describe('cleanPhone', () => {
    it('should strip all non-digits', () => {
      expect(cleanPhone('+221 77 123 45 67')).toBe('221771234567');
      expect(cleanPhone('06-12-34-56-78')).toBe('0612345678');
      expect(cleanPhone('   ')).toBe('');
    });
  });

  describe('phonesMatch', () => {
    it('should match numbers with different prefixes but same last 9 digits', () => {
      expect(phonesMatch('+221771234567', '771234567')).toBe(true);
      expect(phonesMatch('00221771234567', '771234567')).toBe(true);
      expect(phonesMatch('771234567', '771234567')).toBe(true);
      expect(phonesMatch('+33612345678', '0612345678')).toBe(true);
    });

    it('should not match different numbers', () => {
      expect(phonesMatch('+221771234567', '779999999')).toBe(false);
      expect(phonesMatch('12345', '123456')).toBe(false);
    });
  });

  describe('checkPhoneExists', () => {
    const mockClients: Client[] = [
      { id: '1', nom: 'Alice', telephone: '771234567', statut: 'nouvelle', pointsFidelite: 0, totalDepense: 0, nombreVisites: 0, dateInscription: '' },
      { id: '2', nom: 'Bob', telephone: '+33699999999', statut: 'vip', pointsFidelite: 0, totalDepense: 0, nombreVisites: 0, dateInscription: '' }
    ];

    it('should return true if phone matches an existing client', () => {
      expect(checkPhoneExists('+221771234567', mockClients)).toBe(true);
      expect(checkPhoneExists('0699999999', mockClients)).toBe(true);
    });

    it('should return false if phone does not match', () => {
      expect(checkPhoneExists('770000000', mockClients)).toBe(false);
    });
  });

  describe('parseGenericText', () => {
    const mockClients: Client[] = [
      { id: '1', nom: 'Alice', telephone: '771234567', statut: 'nouvelle', pointsFidelite: 0, totalDepense: 0, nombreVisites: 0, dateInscription: '' }
    ];

    it('should parse lines with names and phone numbers', () => {
      const text = `
        Marie Diop +221771234567
        Awa Ndiaye 789999999
      `;
      const result = parseGenericText(text, mockClients);
      expect(result).toHaveLength(2);
      
      // Marie Diop matches Alice's phone number last 9 digits (771234567)
      expect(result[0].nom).toBe('Marie Diop');
      expect(result[0].telephone).toBe('+221771234567');
      expect(result[0].exists).toBe(true);
      expect(result[0].selected).toBe(false);

      // Awa Ndiaye is new
      expect(result[1].nom).toBe('Awa Ndiaye');
      expect(result[1].telephone).toBe('789999999');
      expect(result[1].exists).toBe(false);
      expect(result[1].selected).toBe(true);
    });
  });
});
