import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  action,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', md: 'flex-start' },
        gap: { xs: 1.5, md: 2 },
        mt: { xs: 0.5, sm: 1 },
        mb: { xs: 2.5, md: 3.5 },
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {/* Left: Title block */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ mb: 0.5, '& .MuiBreadcrumbs-separator': { mx: 0.5 } }}
          >
            {breadcrumbs.map((bc, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return isLast ? (
                <Typography key={idx} variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {bc.label}
                </Typography>
              ) : (
                <Link
                  key={idx}
                  underline="hover"
                  color="inherit"
                  href={bc.href || '#'}
                  sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 500 }}
                >
                  {bc.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        )}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.55rem' },
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            wordBreak: 'break-word',
            color: 'text.primary',
            fontFamily: 'Outfit, Inter, sans-serif',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.6,
              fontSize: { xs: '0.78rem', sm: '0.85rem' },
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Right: Action area — wraps below title on mobile */}
      {action && (
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: '100%', md: 'auto' },
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
            '& > button, & > a': {
              flex: { xs: '1 1 auto', sm: '0 0 auto' },
              minHeight: 40,
            },
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader;
