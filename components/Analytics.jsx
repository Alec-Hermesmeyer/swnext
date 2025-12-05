import Script from 'next/script';

// Analytics component - Using the EXACT setup that was working in production
const Analytics = () => {
  return (
    <>
      {/* Google Tag Manager - First Script */}
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-MJNDLQZ');
          `,
        }}
      />
      
      {/* Google Analytics 4 - Main Setup */}
      <Script
        id="google-analytics-setup"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
              var f = d.getElementsByTagName(s)[0],
              j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
              j.async = true;
              j.src = 'https://www.googletagmanager.com/gtag/js?id=' + i + dl;
              f.parentNode.insertBefore(j, f);
            })(window, document, 'script', 'dataLayer', 'G-BXEC44GZQV');
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BXEC44GZQV');
          `,
        }}
      />
      
      {/* Google Analytics - External Script */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-BXEC44GZQV"
        strategy="afterInteractive"
        async
      />
      
      {/* Google Analytics - Configuration */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-BXEC44GZQV');
        `}
      </Script>

      {/* Enhanced Event Tracking */}
      <Script
        id="ga-events"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Track form submissions
            if (typeof window !== 'undefined') {
              window.trackFormSubmit = function(formName) {
                if (typeof gtag !== 'undefined') {
                  gtag('event', 'form_submit', {
                    event_category: 'engagement',
                    event_label: formName,
                    value: 1
                  });
                }
              };
              
              // Track phone clicks
              window.trackPhoneClick = function() {
                if (typeof gtag !== 'undefined') {
                  gtag('event', 'click', {
                    event_category: 'contact',
                    event_label: 'phone_number',
                    value: 1
                  });
                }
              };
              
              // Track scroll depth
              let scrollTracked = {};
              window.addEventListener('scroll', function() {
                const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
                const depths = [25, 50, 75, 90];
                depths.forEach(depth => {
                  if (scrollPercent >= depth && !scrollTracked[depth]) {
                    if (typeof gtag !== 'undefined') {
                      gtag('event', 'scroll', {
                        event_category: 'engagement',
                        event_label: depth + '%',
                        value: depth
                      });
                    }
                    scrollTracked[depth] = true;
                  }
                });
              });
            }
          `,
        }}
      />
    </>
  );
};

export default Analytics;