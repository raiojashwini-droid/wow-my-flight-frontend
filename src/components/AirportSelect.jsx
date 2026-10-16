import React from 'react';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';

export const GLOBAL_AIRPORTS = [
  // ─── India ───
  { code: 'DEL', city: 'New Delhi', country: 'India', name: 'Indira Gandhi Intl Airport' },
  { code: 'BOM', city: 'Mumbai', country: 'India', name: 'Chhatrapati Shivaji Maharaj Intl' },
  { code: 'BLR', city: 'Bengaluru', country: 'India', name: 'Kempegowda Intl Airport' },
  { code: 'MAA', city: 'Chennai', country: 'India', name: 'Chennai Intl Airport' },
  { code: 'HYD', city: 'Hyderabad', country: 'India', name: 'Rajiv Gandhi Intl Airport' },
  { code: 'CCU', city: 'Kolkata', country: 'India', name: 'Netaji Subhash Chandra Bose Intl' },
  { code: 'COK', city: 'Kochi', country: 'India', name: 'Cochin Intl Airport' },
  { code: 'AMD', city: 'Ahmedabad', country: 'India', name: 'Sardar Vallabhbhai Patel Intl' },
  { code: 'PNQ', city: 'Pune', country: 'India', name: 'Pune Airport' },
  { code: 'GOI', city: 'Goa (Dabolim)', country: 'India', name: 'Dabolim Airport' },
  { code: 'GOX', city: 'Goa (Mopa)', country: 'India', name: 'Manohar Intl Airport' },
  { code: 'ATQ', city: 'Amritsar', country: 'India', name: 'Sri Guru Ram Dass Jee Intl' },
  { code: 'TRV', city: 'Thiruvananthapuram', country: 'India', name: 'Trivandrum Intl Airport' },
  { code: 'CCJ', city: 'Kozhikode / Calicut', country: 'India', name: 'Calicut Intl Airport' },
  { code: 'LKO', city: 'Lucknow', country: 'India', name: 'Chaudhary Charan Singh Intl' },
  { code: 'JAI', city: 'Jaipur', country: 'India', name: 'Jaipur Intl Airport' },
  { code: 'CJB', city: 'Coimbatore', country: 'India', name: 'Coimbatore Intl Airport' },
  { code: 'IXC', city: 'Chandigarh', country: 'India', name: 'Shaheed Bhagat Singh Intl' },
  { code: 'NAG', city: 'Nagpur', country: 'India', name: 'Dr. Babasaheb Ambedkar Intl' },
  { code: 'IXE', city: 'Mangalore', country: 'India', name: 'Mangaluru Intl Airport' },
  { code: 'PAT', city: 'Patna', country: 'India', name: 'Jay Prakash Narayan Airport' },
  { code: 'BBI', city: 'Bhubaneswar', country: 'India', name: 'Biju Patnaik Intl Airport' },
  { code: 'GAU', city: 'Guwahati', country: 'India', name: 'Lokpriya Gopinath Bordoloi Intl' },
  { code: 'VTZ', city: 'Visakhapatnam', country: 'India', name: 'Visakhapatnam Airport' },
  { code: 'SXR', city: 'Srinagar', country: 'India', name: 'Sheikh ul-Alam Intl Airport' },
  { code: 'IDR', city: 'Indore', country: 'India', name: 'Devi Ahilyabai Holkar Airport' },
  { code: 'VNS', city: 'Varanasi', country: 'India', name: 'Lal Bahadur Shastri Intl' },
  { code: 'IXB', city: 'Bagdogra / Siliguri', country: 'India', name: 'Bagdogra Airport' },
  { code: 'UDR', city: 'Udaipur', country: 'India', name: 'Maharana Pratap Airport' },

  // ─── UAE & Middle East / Gulf ───
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', name: 'Dubai Intl Airport' },
  { code: 'DWC', city: 'Dubai', country: 'United Arab Emirates', name: 'Al Maktoum Intl Airport' },
  { code: 'AUH', city: 'Abu Dhabi', country: 'United Arab Emirates', name: 'Zayed Intl Airport' },
  { code: 'SHJ', city: 'Sharjah', country: 'United Arab Emirates', name: 'Sharjah Intl Airport' },
  { code: 'DOH', city: 'Doha', country: 'Qatar', name: 'Hamad Intl Airport' },
  { code: 'RUH', city: 'Riyadh', country: 'Saudi Arabia', name: 'King Khalid Intl Airport' },
  { code: 'JED', city: 'Jeddah', country: 'Saudi Arabia', name: 'King Abdulaziz Intl Airport' },
  { code: 'DMM', city: 'Dammam', country: 'Saudi Arabia', name: 'King Fahd Intl Airport' },
  { code: 'MED', city: 'Medina', country: 'Saudi Arabia', name: 'Prince Mohammad Bin Abdulaziz' },
  { code: 'BAH', city: 'Manama', country: 'Bahrain', name: 'Bahrain Intl Airport' },
  { code: 'KWI', city: 'Kuwait City', country: 'Kuwait', name: 'Kuwait Intl Airport' },
  { code: 'MCT', city: 'Muscat', country: 'Oman', name: 'Muscat Intl Airport' },
  { code: 'SLL', city: 'Salalah', country: 'Oman', name: 'Salalah Airport' },
  { code: 'AMM', city: 'Amman', country: 'Jordan', name: 'Queen Alia Intl Airport' },
  { code: 'BEY', city: 'Beirut', country: 'Lebanon', name: 'Beirut-Rafic Hariri Intl' },
  { code: 'TLV', city: 'Tel Aviv', country: 'Israel', name: 'Ben Gurion Airport' },

  // ─── South Asia & Neighbors ───
  { code: 'DAC', city: 'Dhaka', country: 'Bangladesh', name: 'Hazrat Shahjalal Intl Airport' },
  { code: 'CGP', city: 'Chittagong', country: 'Bangladesh', name: 'Shah Amanat Intl Airport' },
  { code: 'KTM', city: 'Kathmandu', country: 'Nepal', name: 'Tribhuvan Intl Airport' },
  { code: 'CMB', city: 'Colombo', country: 'Sri Lanka', name: 'Bandaranaike Intl Airport' },
  { code: 'MLE', city: 'Male', country: 'Maldives', name: 'Velana Intl Airport' },
  { code: 'ISB', city: 'Islamabad', country: 'Pakistan', name: 'Islamabad Intl Airport' },
  { code: 'KHI', city: 'Karachi', country: 'Pakistan', name: 'Jinnah Intl Airport' },
  { code: 'LHE', city: 'Lahore', country: 'Pakistan', name: 'Allama Iqbal Intl Airport' },
  { code: 'SKT', city: 'Sialkot', country: 'Pakistan', name: 'Sialkot Intl Airport' },
  { code: 'PEW', city: 'Peshawar', country: 'Pakistan', name: 'Bacha Khan Intl Airport' },

  // ─── United Kingdom & Ireland ───
  { code: 'LHR', city: 'London', country: 'United Kingdom', name: 'Heathrow Airport' },
  { code: 'LGW', city: 'London', country: 'United Kingdom', name: 'Gatwick Airport' },
  { code: 'STN', city: 'London', country: 'United Kingdom', name: 'Stansted Airport' },
  { code: 'LTN', city: 'London', country: 'United Kingdom', name: 'Luton Airport' },
  { code: 'LCY', city: 'London', country: 'United Kingdom', name: 'London City Airport' },
  { code: 'MAN', city: 'Manchester', country: 'United Kingdom', name: 'Manchester Airport' },
  { code: 'EDI', city: 'Edinburgh', country: 'United Kingdom', name: 'Edinburgh Airport' },
  { code: 'GLA', city: 'Glasgow', country: 'United Kingdom', name: 'Glasgow Airport' },
  { code: 'BHX', city: 'Birmingham', country: 'United Kingdom', name: 'Birmingham Airport' },
  { code: 'BRS', city: 'Bristol', country: 'United Kingdom', name: 'Bristol Airport' },
  { code: 'NCL', city: 'Newcastle', country: 'United Kingdom', name: 'Newcastle Intl Airport' },
  { code: 'LPL', city: 'Liverpool', country: 'United Kingdom', name: 'Liverpool John Lennon' },
  { code: 'BFS', city: 'Belfast', country: 'United Kingdom', name: 'Belfast Intl Airport' },
  { code: 'DUB', city: 'Dublin', country: 'Ireland', name: 'Dublin Airport' },
  { code: 'SNN', city: 'Shannon', country: 'Ireland', name: 'Shannon Airport' },
  { code: 'ORK', city: 'Cork', country: 'Ireland', name: 'Cork Airport' },

  // ─── United States ───
  { code: 'JFK', city: 'New York', country: 'United States', name: 'John F. Kennedy Intl Airport' },
  { code: 'EWR', city: 'New York / Newark', country: 'United States', name: 'Newark Liberty Intl' },
  { code: 'LGA', city: 'New York', country: 'United States', name: 'LaGuardia Airport' },
  { code: 'ORD', city: 'Chicago', country: 'United States', name: 'O\'Hare Intl Airport' },
  { code: 'MDW', city: 'Chicago', country: 'United States', name: 'Chicago Midway Intl' },
  { code: 'SFO', city: 'San Francisco', country: 'United States', name: 'San Francisco Intl Airport' },
  { code: 'OAK', city: 'Oakland / Bay Area', country: 'United States', name: 'Oakland Intl Airport' },
  { code: 'SJC', city: 'San Jose / Bay Area', country: 'United States', name: 'San Jose Mineta Intl' },
  { code: 'LAX', city: 'Los Angeles', country: 'United States', name: 'Los Angeles Intl Airport' },
  { code: 'DFW', city: 'Dallas', country: 'United States', name: 'Dallas/Fort Worth Intl' },
  { code: 'DAL', city: 'Dallas', country: 'United States', name: 'Dallas Love Field' },
  { code: 'IAH', city: 'Houston', country: 'United States', name: 'George Bush Intercontinental' },
  { code: 'HOU', city: 'Houston', country: 'United States', name: 'William P. Hobby Airport' },
  { code: 'ATL', city: 'Atlanta', country: 'United States', name: 'Hartsfield-Jackson Atlanta Intl' },
  { code: 'MIA', city: 'Miami', country: 'United States', name: 'Miami Intl Airport' },
  { code: 'FLL', city: 'Fort Lauderdale', country: 'United States', name: 'Fort Lauderdale-Hollywood' },
  { code: 'MCO', city: 'Orlando', country: 'United States', name: 'Orlando Intl Airport' },
  { code: 'TPA', city: 'Tampa', country: 'United States', name: 'Tampa Intl Airport' },
  { code: 'BOS', city: 'Boston', country: 'United States', name: 'Logan Intl Airport' },
  { code: 'IAD', city: 'Washington D.C.', country: 'United States', name: 'Washington Dulles Intl' },
  { code: 'DCA', city: 'Washington D.C.', country: 'United States', name: 'Ronald Reagan Washington' },
  { code: 'BWI', city: 'Baltimore / Washington', country: 'United States', name: 'Baltimore/Washington Intl' },
  { code: 'SEA', city: 'Seattle', country: 'United States', name: 'Seattle-Tacoma Intl' },
  { code: 'PHX', city: 'Phoenix', country: 'United States', name: 'Phoenix Sky Harbor Intl' },
  { code: 'LAS', city: 'Las Vegas', country: 'United States', name: 'Harry Reid Intl Airport' },
  { code: 'DEN', city: 'Denver', country: 'United States', name: 'Denver Intl Airport' },
  { code: 'DTW', city: 'Detroit', country: 'United States', name: 'Detroit Metropolitan Wayne' },
  { code: 'MSP', city: 'Minneapolis', country: 'United States', name: 'Minneapolis–Saint Paul Intl' },
  { code: 'PHL', city: 'Philadelphia', country: 'United States', name: 'Philadelphia Intl Airport' },
  { code: 'CLT', city: 'Charlotte', country: 'United States', name: 'Charlotte Douglas Intl' },
  { code: 'SAN', city: 'San Diego', country: 'United States', name: 'San Diego Intl Airport' },
  { code: 'SLC', city: 'Salt Lake City', country: 'United States', name: 'Salt Lake City Intl' },
  { code: 'AUS', city: 'Austin', country: 'United States', name: 'Austin-Bergstrom Intl' },

  // ─── Canada ───
  { code: 'YYZ', city: 'Toronto', country: 'Canada', name: 'Toronto Pearson Intl' },
  { code: 'YTZ', city: 'Toronto', country: 'Canada', name: 'Billy Bishop Toronto City' },
  { code: 'YVR', city: 'Vancouver', country: 'Canada', name: 'Vancouver Intl Airport' },
  { code: 'YUL', city: 'Montreal', country: 'Canada', name: 'Montréal-Trudeau Intl' },
  { code: 'YYC', city: 'Calgary', country: 'Canada', name: 'Calgary Intl Airport' },
  { code: 'YEG', city: 'Edmonton', country: 'Canada', name: 'Edmonton Intl Airport' },
  { code: 'YOW', city: 'Ottawa', country: 'Canada', name: 'Ottawa Macdonald-Cartier Intl' },
  { code: 'YHZ', city: 'Halifax', country: 'Canada', name: 'Halifax Stanfield Intl' },
  { code: 'YWG', city: 'Winnipeg', country: 'Canada', name: 'Winnipeg Richardson Intl' },

  // ─── Europe ───
  { code: 'CDG', city: 'Paris', country: 'France', name: 'Charles de Gaulle Airport' },
  { code: 'ORY', city: 'Paris', country: 'France', name: 'Paris Orly Airport' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', name: 'Frankfurt Airport' },
  { code: 'MUC', city: 'Munich', country: 'Germany', name: 'Munich Airport' },
  { code: 'BER', city: 'Berlin', country: 'Germany', name: 'Berlin Brandenburg Airport' },
  { code: 'DUS', city: 'Dusseldorf', country: 'Germany', name: 'Düsseldorf Airport' },
  { code: 'HAM', city: 'Hamburg', country: 'Germany', name: 'Hamburg Airport' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', name: 'Schiphol Airport' },
  { code: 'BRU', city: 'Brussels', country: 'Belgium', name: 'Brussels Airport' },
  { code: 'ZRH', city: 'Zurich', country: 'Switzerland', name: 'Zurich Airport' },
  { code: 'GVA', city: 'Geneva', country: 'Switzerland', name: 'Geneva Airport' },
  { code: 'BSL', city: 'Basel', country: 'Switzerland', name: 'EuroAirport Basel Mulhouse' },
  { code: 'VIE', city: 'Vienna', country: 'Austria', name: 'Vienna Intl Airport' },
  { code: 'FCO', city: 'Rome', country: 'Italy', name: 'Leonardo da Vinci–Fiumicino' },
  { code: 'MXP', city: 'Milan', country: 'Italy', name: 'Milan Malpensa Airport' },
  { code: 'LIN', city: 'Milan', country: 'Italy', name: 'Milan Linate Airport' },
  { code: 'VCE', city: 'Venice', country: 'Italy', name: 'Venice Marco Polo Airport' },
  { code: 'MAD', city: 'Madrid', country: 'Spain', name: 'Adolfo Suárez Madrid–Barajas' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain', name: 'Josep Tarradellas Barcelona-El Prat' },
  { code: 'AGP', city: 'Malaga', country: 'Spain', name: 'Málaga-Costa del Sol Airport' },
  { code: 'LIS', city: 'Lisbon', country: 'Portugal', name: 'Humberto Delgado Airport' },
  { code: 'OPO', city: 'Porto', country: 'Portugal', name: 'Francisco Sá Carneiro Airport' },
  { code: 'ATH', city: 'Athens', country: 'Greece', name: 'Eleftherios Venizelos Intl' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey', name: 'Istanbul Airport' },
  { code: 'SAW', city: 'Istanbul', country: 'Turkey', name: 'Sabiha Gökçen Intl' },
  { code: 'WAW', city: 'Warsaw', country: 'Poland', name: 'Warsaw Chopin Airport' },
  { code: 'PRG', city: 'Prague', country: 'Czechia', name: 'Václav Havel Airport Prague' },
  { code: 'BUD', city: 'Budapest', country: 'Hungary', name: 'Budapest Ferenc Liszt Intl' },
  { code: 'CPH', city: 'Copenhagen', country: 'Denmark', name: 'Copenhagen Airport' },
  { code: 'ARN', city: 'Stockholm', country: 'Sweden', name: 'Stockholm Arlanda Airport' },
  { code: 'OSL', city: 'Oslo', country: 'Norway', name: 'Oslo Gardermoen Airport' },
  { code: 'HEL', city: 'Helsinki', country: 'Finland', name: 'Helsinki-Vantaa Airport' },

  // ─── Southeast Asia & East Asia ───
  { code: 'SIN', city: 'Singapore', country: 'Singapore', name: 'Singapore Changi Airport' },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', name: 'Suvarnabhumi Airport' },
  { code: 'DMK', city: 'Bangkok', country: 'Thailand', name: 'Don Mueang Intl Airport' },
  { code: 'HKT', city: 'Phuket', country: 'Thailand', name: 'Phuket Intl Airport' },
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', name: 'Kuala Lumpur Intl Airport' },
  { code: 'PEN', city: 'Penang', country: 'Malaysia', name: 'Penang Intl Airport' },
  { code: 'CGK', city: 'Jakarta', country: 'Indonesia', name: 'Soekarno-Hatta Intl Airport' },
  { code: 'DPS', city: 'Bali / Denpasar', country: 'Indonesia', name: 'Ngurah Rai Intl Airport' },
  { code: 'MNL', city: 'Manila', country: 'Philippines', name: 'Ninoy Aquino Intl Airport' },
  { code: 'CEB', city: 'Cebu', country: 'Philippines', name: 'Mactan-Cebu Intl Airport' },
  { code: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', name: 'Tan Son Nhat Intl Airport' },
  { code: 'HAN', city: 'Hanoi', country: 'Vietnam', name: 'Noi Bai Intl Airport' },
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', name: 'Hong Kong Intl Airport' },
  { code: 'TPE', city: 'Taipei', country: 'Taiwan', name: 'Taiwan Taoyuan Intl Airport' },
  { code: 'HND', city: 'Tokyo', country: 'Japan', name: 'Tokyo Haneda Airport' },
  { code: 'NRT', city: 'Tokyo', country: 'Japan', name: 'Narita Intl Airport' },
  { code: 'KIX', city: 'Osaka', country: 'Japan', name: 'Kansai Intl Airport' },
  { code: 'ICN', city: 'Seoul', country: 'South Korea', name: 'Incheon Intl Airport' },
  { code: 'PVG', city: 'Shanghai', country: 'China', name: 'Shanghai Pudong Intl' },
  { code: 'CAN', city: 'Guangzhou', country: 'China', name: 'Guangzhou Baiyun Intl' },
  { code: 'PEK', city: 'Beijing', country: 'China', name: 'Beijing Capital Intl Airport' },

  // ─── Australia & New Zealand & Pacific ───
  { code: 'SYD', city: 'Sydney', country: 'Australia', name: 'Sydney Kingsford Smith' },
  { code: 'MEL', city: 'Melbourne', country: 'Australia', name: 'Melbourne Airport' },
  { code: 'BNE', city: 'Brisbane', country: 'Australia', name: 'Brisbane Airport' },
  { code: 'PER', city: 'Perth', country: 'Australia', name: 'Perth Airport' },
  { code: 'ADL', city: 'Adelaide', country: 'Australia', name: 'Adelaide Airport' },
  { code: 'AKL', city: 'Auckland', country: 'New Zealand', name: 'Auckland Airport' },
  { code: 'CHC', city: 'Christchurch', country: 'New Zealand', name: 'Christchurch Intl' },
  { code: 'NAN', city: 'Nadi', country: 'Fiji', name: 'Nadi Intl Airport' },

  // ─── Africa ───
  { code: 'CAI', city: 'Cairo', country: 'Egypt', name: 'Cairo Intl Airport' },
  { code: 'JNB', city: 'Johannesburg', country: 'South Africa', name: 'O. R. Tambo Intl Airport' },
  { code: 'CPT', city: 'Cape Town', country: 'South Africa', name: 'Cape Town Intl Airport' },
  { code: 'NBO', city: 'Nairobi', country: 'Kenya', name: 'Jomo Kenyatta Intl Airport' },
  { code: 'ADD', city: 'Addis Ababa', country: 'Ethiopia', name: 'Addis Ababa Bole Intl' },
  { code: 'LOS', city: 'Lagos', country: 'Nigeria', name: 'Murtala Muhammed Intl' },
  { code: 'ACC', city: 'Accra', country: 'Ghana', name: 'Kotoka Intl Airport' },
  { code: 'CMN', city: 'Casablanca', country: 'Morocco', name: 'Mohammed V Intl Airport' },
  { code: 'MRU', city: 'Port Louis', country: 'Mauritius', name: 'Sir Seewoosagur Ramgoolam Intl' },
  { code: 'SEZ', city: 'Mahe', country: 'Seychelles', name: 'Seychelles Intl Airport' }
];

const filter = createFilterOptions();

/**
 * Reusable AirportSelect component supporting:
 * - Search by 3-letter IATA code (e.g. DEL, JFK, LHR, DXB)
 * - Search by City name (e.g. Delhi, London, Dubai, New York)
 * - Search by Country name (e.g. India, United Kingdom, USA)
 * - Custom input allowance (if user types an unlisted 3-letter code)
 */
export default function AirportSelect({
  value,
  onChange,
  label = 'Airport / City',
  placeholder = 'Type city or code (e.g. London, DEL)...',
  type = 'origin', // 'origin' | 'destination'
  size = 'small',
  fullWidth = true,
  disabled = false,
  error = false,
  helperText = ''
}) {
  // Find current selected airport object or create custom wrapper
  const selectedOption = React.useMemo(() => {
    if (!value) return null;
    const upperVal = String(value).trim().toUpperCase();
    const found = GLOBAL_AIRPORTS.find(a => a.code === upperVal);
    if (found) return found;
    return { code: upperVal, city: upperVal, country: 'Custom Airport', name: `${upperVal} Airport` };
  }, [value]);

  return (
    <Autocomplete
      value={selectedOption}
      onChange={(_, newValue) => {
        if (typeof newValue === 'string') {
          onChange(newValue.toUpperCase());
        } else if (newValue && newValue.code) {
          onChange(newValue.code);
        } else {
          onChange('');
        }
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, {
          ...params,
          // Custom stringifier to match city, code, country, or airport name
          stringify: (option) => `${option.code} ${option.city} ${option.country} ${option.name}`
        });

        const { inputValue } = params;
        const isExisting = options.some((option) => inputValue.toUpperCase() === option.code);
        if (inputValue !== '' && !isExisting) {
          filtered.unshift({
            code: inputValue.toUpperCase().slice(0, 4),
            city: `Custom (${inputValue.toUpperCase()})`,
            country: 'Enter Code',
            name: 'Direct IATA Entry'
          });
        }

        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      options={GLOBAL_AIRPORTS}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return `${option.code} - ${option.city} (${option.country})`;
      }}
      renderOption={(props, option) => {
        const { key, ...restProps } = props;
        return (
          <Box
            key={key || option.code}
            component="li"
            {...restProps}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              py: 1,
              px: 1.5,
              borderBottom: '1px solid rgba(0,0,0,0.04)',
              '&:hover': {
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Chip
                label={option.code}
                size="small"
                color={type === 'origin' ? 'primary' : 'secondary'}
                sx={{
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.04em',
                  minWidth: 46
                }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {option.city}, {option.country}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {option.name}
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      }}
      disabled={disabled}
      renderInput={(params) => {
        const adornmentIcon = type === 'origin' ? (
          <FlightTakeoffIcon sx={{ color: 'primary.main', mr: 0.8, fontSize: 18 }} />
        ) : (
          <FlightLandIcon sx={{ color: 'secondary.main', mr: 0.8, fontSize: 18 }} />
        );

        const existingStartAdornment = params?.slotProps?.input?.startAdornment || params?.InputProps?.startAdornment;

        const combinedAdornment = (
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            {adornmentIcon}
            {existingStartAdornment}
          </Box>
        );

        return (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            size={size}
            fullWidth={fullWidth}
            error={error}
            helperText={helperText}
            {...(params.InputProps ? {
              InputProps: {
                ...params.InputProps,
                startAdornment: combinedAdornment
              }
            } : {})}
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps?.input,
                startAdornment: combinedAdornment
              }
            }}
            sx={{
              '& .MuiInputBase-root': {
                borderRadius: 2
              }
            }}
          />
        );
      }}
    />
  );
}
