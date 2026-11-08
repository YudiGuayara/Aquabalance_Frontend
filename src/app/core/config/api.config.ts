import { environment } from '../../../environments/environment';

export const API_CONFIG = {
  BASE_URL: environment.apiUrl,
  clima: 'https://api.open-meteo.com/v1/forecast'
};
