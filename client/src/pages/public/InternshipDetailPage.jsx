import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FullPageLoader } from '../../components/common/Loader';

/**
 * InternshipDetailPage — Now acts as a redirect layer.
 * All internship details and application flows are handled in the Drawer on the main InternshipsPage.
 * Redirects /internships/:id -> /internships?selected=:id
 */
const InternshipDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      // Redirect to the main listings page with the drawer opened
      navigate(`/internships?selected=${id}`, { replace: true });
    } else {
      navigate('/internships', { replace: true });
    }
  }, [id, navigate]);

  return <FullPageLoader message="Redirecting to internship details..." />;
};

export default InternshipDetailPage;
