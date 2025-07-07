import * as yup from 'yup';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../constants/api';

const checkUsernameUnique = async (username: string) => {
  const resp = await fetch(`${API_BASE_URL}/api/userProfiles/check?username=${encodeURIComponent(username)}`);
  const available = await resp.json();
  return available;
};

export const profileSchema = yup.object({
  firstName: yup.string().min(2).required(),
  lastName: yup.string().min(2).required(),
  username: yup.string().min(3).test('unique', 'Benutzername bereits vergeben', checkUsernameUnique).required(),
  birthDate: yup.date().test('age', 'Du musst mindestens 18 Jahre alt sein', value => dayjs().diff(value, 'year') >= 18).required(),
  phone: yup.string().matches(/^\+?[0-9]{7,15}$/, 'Ung\u00fcltige Telefonnummer').optional(),
  address: yup.string().min(2).required(),
  language: yup.string().required(),
  nationality: yup.string().required(),
  gender: yup.string().required(),
  interests: yup.string().optional(),
  avatar: yup.mixed().nullable(),
});

export type ProfileFormValues = yup.InferType<typeof profileSchema>;
