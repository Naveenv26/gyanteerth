import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * CertificateTemplate Component
 * Renders the Gyanteerth Certificate of Completion using HTML/CSS
 * and provides a download functionality via jsPDF + html2canvas.
 */
const CertificateGenerator = ({ 
  candidateName = "Candidate Name", 
  courseName = "Full Stack Web Development", 
  startDate = "January 2024", 
  endDate = "April 2024",
  certificateId = "GT-" + Math.random().toString(36).substr(2, 9).toUpperCase()
}) => {
  const certificateRef = useRef(null);

  const downloadPDF = async () => {
    const element = certificateRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 3, // High quality scale
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 3, canvas.height / 3]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 3, canvas.height / 3);
      pdf.save(`Certificate_${candidateName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Certificate generation failed:", error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
      
      {/* DOWNLOAD BUTTON */}
      <button 
        onClick={downloadPDF}
        style={{
          padding: '0.75rem 2rem',
          backgroundColor: '#059669',
          color: 'white',
          border: 'none',
          borderRadius: '0.75rem',
          fontWeight: '900',
          fontSize: '0.9rem',
          cursor: 'pointer',
          boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.3)',
          transition: 'all 0.2s',
          marginBottom: '1rem',
          zIndex: 100
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
      >
        Download Certificate (PDF)
      </button>

      {/* CERTIFICATE PREVIEW CONTAINER */}
      <div 
        ref={certificateRef}
        style={{
          width: '794px', 
          height: '1123px',
          backgroundColor: 'white',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Outfit', 'Inter', sans-serif",
          color: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '60px',
          transform: 'scale(0.45)', // Optimized for perfect 'compact' on-screen focus
          transformOrigin: 'top center',
          marginBottom: '-510px', // Compensation for 0.45 scale
          boxShadow: '0 40px 100px rgba(0,0,0,0.2)'
        }}
      >
        {/* TOP DECORATIVE BLOB (matches template) */}
        <div style={{ 
          position: 'absolute', top: '-50px', right: '-120px', width: '500px', height: '350px',
          background: 'linear-gradient(225deg, #000 30%, #444 60%, var(--color-primary, #f97316) 100%)',
          borderRadius: '50% 0 50% 50%', transform: 'rotate(-5deg)', opacity: 0.9, zIndex: 1 
        }} />
        <div style={{ 
          position: 'absolute', top: '10px', right: '10px', width: '400px', height: '280px',
          background: 'rgba(249, 115, 22, 0.4)', borderRadius: '50% 0 50% 50%', zIndex: 0 
        }} />

        {/* LOGO AREA */}
        <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 10 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '42px', fontWeight: 900, color: '#059669' }}>g</span>
              <span style={{ fontSize: '28px', fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>yanteerth</span>
              <span style={{ fontSize: '10px', verticalAlign: 'top', fontWeight: 900, color: '#059669' }}>TM</span>
           </div>
           <div style={{ fontSize: '12px', fontWeight: 700, color: '#000', letterSpacing: '0.05em' }}>
              Committed towards excellence
           </div>
        </div>

        {/* MAIN TEXT */}
        <div style={{ marginTop: '140px', textAlign: 'center', width: '100%', zIndex: 10 }}>
          <h1 style={{ fontSize: '64px', fontWeight: 300, letterSpacing: '8px', margin: '0', color: '#000' }}>CERTIFICATE</h1>
          <h2 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '3px', marginTop: '20px', color: '#1a1a1a', textTransform: 'uppercase' }}>OF COMPLETION</h2>
          
          <div style={{ marginTop: '60px', fontSize: '18px', fontWeight: 700, color: '#4b5563' }}>
            This is to certify that
          </div>

          <div style={{ 
            marginTop: '30px', 
            fontSize: '52px', 
            fontFamily: "'Playball', cursive, serif", // Fallback to serif
            fontWeight: 400, 
            color: '#000',
            borderBottom: '2px solid #000',
            display: 'inline-block',
            padding: '0 40px 10px 40px',
            fontStyle: 'italic'
          }}>
            {candidateName}
          </div>

          <div style={{ marginTop: '60px', maxWidth: '600px', margin: '60px auto 0 auto', lineHeight: '1.6', fontSize: '16px', fontWeight: 600, color: '#374151' }}>
            has successfully completed the 
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#000', margin: '15px 0' }}>{courseName}</div>
            conducted by <span style={{ color: '#059669', fontWeight: 900 }}>GyanTeerth</span>, from {startDate} to {endDate}.
          </div>

          <p style={{ marginTop: '30px', maxWidth: '620px', margin: '30px auto 0 auto', lineHeight: '1.5', fontSize: '15px', fontWeight: 500, color: '#4b5563' }}>
            During this period, the participant has demonstrated dedication, consistency, and a strong understanding of the concepts covered in the program. We congratulate them on their achievement and wish them success in their future endeavors.
          </p>
        </div>

        {/* SIGNATURE & ACCREDITATIONS */}
        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '40px', zIndex: 10 }}>
          
          {/* Signature */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ borderBottom: '1px solid #d1d5db', width: '200px', marginBottom: '15px' }} />
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#1a1a1a', textTransform: 'uppercase' }}>Vikrant Sukhtankar</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginTop: '4px' }}>CEO & FOUNDER</div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '28px', fontWeight: 900, color: '#0369a1', lineHeight: 1 }}>ISO</div>
               <div style={{ borderTop: '1px solid #0369a1', marginTop: '2px', paddingTop: '2px', fontSize: '8px', fontWeight: 900 }}>9001:2015</div>
               <div style={{ fontSize: '7px', color: '#666' }}>305026030345Q</div>
            </div>
            
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: '2px solid #0369a1', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 900, color: '#0369a1', textAlign: 'center' }}>
               <div style={{ fontSize: '6px' }}>INTERNATIONAL</div>
               <div style={{ fontSize: '20px', fontWeight: 950 }}>IAF</div>
               <div style={{ borderTop: '1px solid #0369a1', borderBottom: '1px solid #0369a1', margin: '2px 0' }}>ACCREDITATION FORUM</div>
            </div>
          </div>
        </div>

        {/* BOTTOM DECORATIVE BLOB */}
        <div style={{ 
          position: 'absolute', bottom: '-80px', left: '-100px', width: '450px', height: '300px',
          background: 'linear-gradient(45deg, #000 30%, #444 60%, var(--color-primary, #f97316) 100%)',
          borderRadius: '0 50% 50% 50%', transform: 'rotate(10deg)', opacity: 0.9, zIndex: 1 
        }} />
        <div style={{ 
          position: 'absolute', bottom: '-40px', left: '-40px', width: '350px', height: '250px',
          background: 'rgba(249, 115, 22, 0.4)', borderRadius: '0 50% 50% 50%', zIndex: 0 
        }} />

        {/* Certificate ID */}
        <div style={{ position: 'absolute', bottom: '20px', right: '20px', fontSize: '9px', color: '#9ca3af', fontWeight: 700 }}>
          CERT ID: {certificateId}
        </div>
      </div>

      {/* Font imports for the certificate */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playball&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
};

export default CertificateGenerator;
