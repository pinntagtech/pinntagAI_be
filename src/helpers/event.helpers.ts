import { Client } from '@googlemaps/google-maps-services-js';
// export const getDateInDashFormat = (date: Date) => {
//   let day = date.getDate().toString();
//   if (day.length < 2) day = '0' + day;
//   let month = (date.getMonth() + 1).toString();
//   if (month.length < 2) month = '0' + month;
//   const year = date.getFullYear();
//   return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
// };

// export const getDateInDashFormatForEndDate = (date: Date) => {
//   let day = date.getDate().toString();
//   if (day.length < 2) day = '0' + day;
//   let month = (date.getMonth() + 1).toString();
//   if (month.length < 2) month = '0' + month;
//   const year = date.getFullYear();
//   return new Date(`${year}-${month}-${day}T23:59:59.000Z`);
// };

// export const getDateInStringFormat = (date: Date) => {
//   let day = date.getUTCDate().toString();
//   if (day.length < 2) day = '0' + day;
//   let month = (date.getMonth() + 1).toString();
//   if (month.length < 2) month = '0' + month;
//   const year = date.getFullYear();
//   return `${year}-${month}-${day}`;
// };

export const getZeroBodyDateTz = (date: Date, tz?: string, log?: boolean) => {
  // const timeZone = tz || 'America/Chicago'; // Lubbock, US timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    // timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year').value;
  const month = parts.find((part) => part.type === 'month').value;
  const day = Number(parts.find((part) => part.type === 'day').value);
  const output = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0),
  );
  if (log) {
    console.log('parts............', parts);
    console.log('year............', year);
    console.log('month............', month);
    console.log('day............', day);
    console.log('output............', output);
  }
  return output; // CST/CDT timezone offset
};

export const getZeroDateTz = (date: Date, tz?: string, log?: boolean) => {
  const timeZone = tz || 'America/Chicago'; // Lubbock, US timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year').value;
  const month = parts.find((part) => part.type === 'month').value;
  const day = Number(parts.find((part) => part.type === 'day').value);
  const output = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0),
  );
  if (log) {
    console.log('parts............', parts);
    console.log('year............', year);
    console.log('month............', month);
    console.log('day............', day);
    console.log('output............', output);
  }
  return output; // CST/CDT timezone offset
};

export const currentDateTz = (tz?: string) => {
  const timeZone = tz || 'America/Chicago'; // Lubbock, US timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year').value;
  const month = parts.find((part) => part.type === 'month').value;
  const day = parts.find((part) => part.type === 'day').value;
  const hour = parts.find((part) => part.type === 'hour').value;
  const minute = parts.find((part) => part.type === 'minute').value;
  const second = '00'; // Assuming don't need seconds precision
  const output = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
    ),
  );
  return output; // CST/CDT timezone offset
  // return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`); // CST/CDT timezone offset
};

export const endDateTz = (tz?: string) => {
  //Timezone for UTC -5 hrs CDT only
  const timeZone = tz || 'America/Chicago'; // Lubbock, US timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year').value;
  const month = parts.find((part) => part.type === 'month').value;
  const day = parts.find((part) => part.type === 'day').value;
  const hour = '23';
  const minute = '59';
  const second = '59'; // Assuming don't need seconds precision
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`); // CST/CDT timezone offset
};

export const anyDateTz = (datee: Date, tz?: string) => {
  const timeZone = tz || 'America/Chicago'; // Lubbock, US timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const date = new Date(datee);
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year').value;
  const month = parts.find((part) => part.type === 'month').value;
  const day = parts.find((part) => part.type === 'day').value;
  const hour = parts.find((part) => part.type === 'hour').value;
  const minute = parts.find((part) => part.type === 'minute').value;
  const second = '00'; // Assuming don't need seconds precision

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`); // CST/CDT timezone offset
};

export const getStringBodyDateTz = (date: Date, tz?: string) => {
  // const timeZone = tz || 'America/Chicago'; // Lubbock, US timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    // timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  let day = parts.find((part) => part.type === 'day')?.value;
  day = day.length == 1 ? `0${day}` : day;
  // console.log(`${year}-${month}-${day}`);
  return `${year}-${month}-${day}`;
};

export const getStringDateCurrentTz = (date: Date, tz?: string) => {
  // const timeZone = tz || 'America/Chicago'; // Lubbock, US timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    // timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  console.log(`${year}-${month}-${day}`);
  return `${year}-${month}-${day}`;
};

export const getStringDateTz = (date: Date, tz?: string) => {
  const timeZone = tz || 'America/Chicago'; // Lubbock, US timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  console.log(`${year}-${month}-${day}`);
  return `${year}-${month}-${day}`;
};

export const getStringDateTzWithTime = (date: Date, tz = 'America/Chicago') => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const parts = formatter.formatToParts(date);

  const day = parts.find(p => p.type === 'day')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const year = parts.find(p => p.type === 'year')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value?.toUpperCase();

  return `${day} ${month} ${year} ${hour}:${minute} ${dayPeriod}`;
};

export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  console.log(`Calculating distance between (${lat1}, ${lon1}) and (${lat2}, ${lon2})`);
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180; // Convert degrees to radians
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance * 0.621371; // in miles
};

export const calculateDistanceWithGoogle = async (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const client = new Client({});
  const origins = [{ lat: lat1, lng: lon1 }];
  const destinations = [{ lat: lat2, lng: lon2 }];
  const result = await client.distancematrix({
    params: {
      origins,
      destinations,
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
  });
  if (result.data.rows[0].elements[0].status !== 'OK') {
    return -1;
  } else {
    return result.data.rows[0].elements[0].distance.value / 1000;
  }
};

export interface Card {
  number: string;
  exp_month: number;
  exp_year: number;
  cvc: string;
}
