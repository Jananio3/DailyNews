import { useState, useEffect, useRef } from 'react';
import $ from 'jquery';
import './App.css';

// Predefined lists for filters and selections
const CATEGORIES = ['Business', 'Technology', 'Politics', 'Sports', 'Entertainment', 'Health', 'General'];
const LANGUAGES = ['English', 'Spanish', 'French', 'Hindi', 'Chinese', 'Arabic', 'German', 'Japanese'];
const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa', 'Local'];

function App() {
  // --- Presentation Settings States (stored in LocalStorage) ---
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('news_presentation_settings');
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed.theme || 'dark';
  });
  
  const [layoutMode, setLayoutMode] = useState(() => {
    const saved = localStorage.getItem('news_presentation_settings');
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed.layoutMode || 'grid';
  });

  const [limit, setLimit] = useState(() => {
    const saved = localStorage.getItem('news_presentation_settings');
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed.limit || 6;
  });

  // --- Core Application States ---
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'entry'
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // --- Pagination & Filter States ---
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // --- CRUD/Form States ---
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Form input fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formRegion, setFormRegion] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formLanguage, setFormLanguage] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formCountry, setFormCountry] = useState('');
  
  // File upload states
  const [bannerImages, setBannerImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [bannerPreviews, setBannerPreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);

  // Existing files when editing
  const [retainedBannerImages, setRetainedBannerImages] = useState([]);
  const [retainedVideos, setRetainedVideos] = useState([]);

  // Form validation errors
  const [validationErrors, setValidationErrors] = useState({});
  const [draftAlert, setDraftAlert] = useState(false);

  // View modal state
  const [selectedNews, setSelectedNews] = useState(null);

  // Refs for file inputs
  const bannerInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // --- Theme Effect ---
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    // Save presentation settings
    localStorage.setItem('news_presentation_settings', JSON.stringify({ theme, layoutMode, limit }));
  }, [theme, layoutMode, limit]);

  // --- Fetch News Effect ---
  useEffect(() => {
    fetchNews();
  }, [search, categoryFilter, statusFilter, languageFilter, regionFilter, page, limit]);

  // --- Form Draft Autosave Effect (Only when creating a new record) ---
  useEffect(() => {
    if (activeTab === 'entry' && editingRecord === null) {
      const draft = {
        formTitle,
        formDescription,
        formCategory,
        formDate,
        formRegion,
        formStatus,
        formLanguage,
        formCity,
        formCountry
      };
      localStorage.setItem('news_form_draft', JSON.stringify(draft));
    }
  }, [formTitle, formDescription, formCategory, formDate, formRegion, formStatus, formLanguage, formCity, formCountry, activeTab, editingRecord]);

  // --- Alert Timers ---
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 7000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // --- AJAX Operations ---
  const fetchNews = () => {
    setLoading(true);
    $.ajax({
      url: '/api.php?action=list',
      method: 'GET',
      data: {
        search,
        category: categoryFilter,
        status: statusFilter,
        language: languageFilter,
        region: regionFilter,
        page,
        limit
      },
      dataType: 'json',
      success: (res) => {
        if (res.status === 'success') {
          setNewsList(res.data);
          setTotalPages(res.pagination.total_pages);
          setTotalRecords(res.pagination.total_records);
        } else {
          setErrorMessage(res.message || 'Failed to fetch news records.');
        }
        setLoading(false);
      },
      error: (xhr) => {
        const err = xhr.responseJSON;
        setErrorMessage(err?.message || 'An error occurred while loading news records.');
        setLoading(false);
      }
    });
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setFormTitle(record.News_Title);
    setFormDescription(record.News_Description);
    setFormCategory(record.Category);
    setFormDate(record.News_Date);
    setFormRegion(record.Region || '');
    setFormStatus(record.Status);
    setFormLanguage(record.Language || '');
    setFormCity(record.City || '');
    setFormCountry(record.Country || '');
    
    // Existing files
    setRetainedBannerImages(record.News_Banner_Image || []);
    setRetainedVideos(record.News_Videos || []);

    // Clear uploads
    setBannerImages([]);
    setVideos([]);
    setBannerPreviews([]);
    setVideoPreviews([]);
    setValidationErrors({});
    
    setActiveTab('entry');
  };

  const handleAddNewClick = () => {
    setEditingRecord(null);
    setValidationErrors({});
    
    // Check for draft in LocalStorage
    const draftStr = localStorage.getItem('news_form_draft');
    if (draftStr) {
      setDraftAlert(true);
    } else {
      resetForm();
    }
    setActiveTab('entry');
  };

  const restoreDraft = () => {
    const draftStr = localStorage.getItem('news_form_draft');
    if (draftStr) {
      const draft = JSON.parse(draftStr);
      setFormTitle(draft.formTitle || '');
      setFormDescription(draft.formDescription || '');
      setFormCategory(draft.formCategory || '');
      setFormDate(draft.formDate || '');
      setFormRegion(draft.formRegion || '');
      setFormStatus(draft.formStatus || 'Active');
      setFormLanguage(draft.formLanguage || '');
      setFormCity(draft.formCity || '');
      setFormCountry(draft.formCountry || '');
    }
    setDraftAlert(false);
  };

  const clearDraft = () => {
    localStorage.removeItem('news_form_draft');
    resetForm();
    setDraftAlert(false);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('');
    setFormDate('');
    setFormRegion('');
    setFormStatus('Active');
    setFormLanguage('');
    setFormCity('');
    setFormCountry('');
    setBannerImages([]);
    setVideos([]);
    setBannerPreviews([]);
    setVideoPreviews([]);
    setRetainedBannerImages([]);
    setRetainedVideos([]);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // --- File Change Handlers & Client Side Validation ---
  const handleBannerChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const maxMB = 5;
    const maxSizeBytes = maxMB * 1024 * 1024;
    
    for (let file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowed.includes(ext)) {
        alert(`File "${file.name}" has an invalid extension. Allowed extensions: ${allowed.join(', ')}`);
        e.target.value = '';
        return;
      }
      if (file.size > maxSizeBytes) {
        alert(`File "${file.name}" exceeds the maximum size of ${maxMB}MB.`);
        e.target.value = '';
        return;
      }
    }

    setBannerImages(files);
    
    // Create previews
    const previews = files.map(file => {
      return {
        name: file.name,
        url: URL.createObjectURL(file)
      };
    });
    setBannerPreviews(previews);
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    const allowed = ['mp4', 'webm', 'ogg', 'avi', 'mov'];
    const maxMB = 5;
    const maxSizeBytes = maxMB * 1024 * 1024;
    
    for (let file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowed.includes(ext)) {
        alert(`File "${file.name}" has an invalid extension. Allowed extensions: ${allowed.join(', ')}`);
        e.target.value = '';
        return;
      }
      if (file.size > maxSizeBytes) {
        alert(`File "${file.name}" exceeds the maximum size of ${maxMB}MB.`);
        e.target.value = '';
        return;
      }
    }

    setVideos(files);
    
    // Create previews
    const previews = files.map(file => {
      return {
        name: file.name,
        url: URL.createObjectURL(file)
      };
    });
    setVideoPreviews(previews);
  };

  const removeExistingBanner = (index) => {
    setRetainedBannerImages(retainedBannerImages.filter((_, i) => i !== index));
  };

  const removeExistingVideo = (index) => {
    setRetainedVideos(retainedVideos.filter((_, i) => i !== index));
  };

  const removeNewBanner = (index) => {
    const updated = bannerImages.filter((_, i) => i !== index);
    setBannerImages(updated);
    setBannerPreviews(bannerPreviews.filter((_, i) => i !== index));
    if (updated.length === 0 && bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const removeNewVideo = (index) => {
    const updated = videos.filter((_, i) => i !== index);
    setVideos(updated);
    setVideoPreviews(videoPreviews.filter((_, i) => i !== index));
    if (updated.length === 0 && videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  // --- Form Submission & API Call ---
  const handleSubmit = (e) => {
    e.preventDefault();

    // Client side validations
    const errors = {};
    if (!formTitle.trim()) errors.title = 'News Title is required';
    if (!formDescription.trim()) errors.description = 'News Description is required';
    if (!formCategory) errors.category = 'Category is required';
    if (!formDate) errors.date = 'News Date is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage('Please correct the validation errors before submitting.');
      return;
    }

    setValidationErrors({});
    setSubmitting(true);

    const formData = new FormData();
    formData.append('News_Title', formTitle);
    formData.append('News_Description', formDescription);
    formData.append('Category', formCategory);
    formData.append('News_Date', formDate);
    formData.append('Region', formRegion);
    formData.append('Status', formStatus);
    formData.append('Language', formLanguage);
    formData.append('City', formCity);
    formData.append('Country', formCountry);

    // Append Banner Images
    for (let file of bannerImages) {
      formData.append('News_Banner_Image[]', file);
    }

    // Append Videos
    for (let file of videos) {
      formData.append('News_Videos[]', file);
    }

    let url = '/api.php?action=create';

    if (editingRecord) {
      url = '/api.php?action=update';
      formData.append('News_Id', editingRecord.News_Id);
      formData.append('Retained_Banner_Images', JSON.stringify(retainedBannerImages));
      formData.append('Retained_Videos', JSON.stringify(retainedVideos));
      formData.append('UpdatedBy', 'Janani (Admin)');
    } else {
      formData.append('CreatedBy', 'Janani (Admin)');
    }

    $.ajax({
      url: url,
      method: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      dataType: 'json',
      success: (res) => {
        setSubmitting(false);
        if (res.status === 'success') {
          setSuccessMessage(res.message || 'Operation completed successfully!');
          
          // Clear draft if it was a create
          if (!editingRecord) {
            localStorage.removeItem('news_form_draft');
          }
          
          resetForm();
          setEditingRecord(null);
          setActiveTab('dashboard');
          fetchNews();
        } else {
          setErrorMessage(res.message || 'An error occurred.');
        }
      },
      error: (xhr) => {
        setSubmitting(false);
        const err = xhr.responseJSON;
        setErrorMessage(err?.message || 'A server error occurred during submission.');
      }
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this news record? This will also delete all uploaded media files.')) {
      $.ajax({
        url: `/api.php?action=delete&id=${id}`,
        method: 'GET',
        dataType: 'json',
        success: (res) => {
          if (res.status === 'success') {
            setSuccessMessage(res.message || 'Record deleted successfully.');
            // Adjust page number if deleting last item of page
            if (newsList.length === 1 && page > 1) {
              setPage(page - 1);
            } else {
              fetchNews();
            }
          } else {
            setErrorMessage(res.message || 'Failed to delete record.');
          }
        },
        error: (xhr) => {
          const err = xhr.responseJSON;
          setErrorMessage(err?.message || 'An error occurred during deletion.');
        }
      });
    }
  };

  // --- Category Color Badges Helper ---
  const getCategoryClass = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'technology': return 'bg-purple-subtle text-purple border-purple-subtle';
      case 'business': return 'bg-primary-subtle text-primary border-primary-subtle';
      case 'politics': return 'bg-danger-subtle text-danger border-danger-subtle';
      case 'sports': return 'bg-success-subtle text-success border-success-subtle';
      case 'entertainment': return 'bg-warning-subtle text-warning border-warning-subtle';
      case 'health': return 'bg-info-subtle text-info border-info-subtle';
      default: return 'bg-secondary-subtle text-secondary border-secondary-subtle';
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg glass-navbar py-3">
        <div className="container">
          <div className="d-flex align-items-center">
            <div className="bg-gradient-primary rounded-3 p-2 me-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-newspaper text-white fs-4"></i>
            </div>
            <div>
              <span className="navbar-brand fw-bold mb-0 h4 tracking-tight">Daily<span className="text-gradient">News</span></span>
              <small className="text-muted d-block font-monospace" style={{ fontSize: '0.75rem', marginTop: '-3px' }}>News Module</small>
            </div>
          </div>
          
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            {/* Header Navigation Tab Buttons */}
            <div className="nav nav-pills ms-lg-5 me-auto my-3 my-lg-0 gap-2">
              <button 
                className={`nav-link px-4 py-2 d-flex align-items-center gap-2 ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <i className="bi bi-grid-1x2-fill"></i>
                Dashboard
              </button>
              <button 
                className={`nav-link px-4 py-2 d-flex align-items-center gap-2 ${activeTab === 'entry' ? 'active' : ''}`}
                onClick={handleAddNewClick}
              >
                <i className="bi bi-plus-circle-fill"></i>
                News Master Entry
              </button>
            </div>

            {/* Right side items: Theme switcher and User Profile info */}
            <div className="d-flex align-items-center gap-3">
              <button 
                className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center" 
                style={{ width: '40px', height: '40px' }}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <i className={`bi fs-5 ${theme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-fill'}`}></i>
              </button>

              <div className="d-flex align-items-center gap-2 border-start ps-3 border-secondary-subtle">
                <div className="bg-primary rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}>
                  J
                </div>
                <div className="d-none d-md-block text-start leading-none">
                  <span className="fw-semibold d-block text-sm">Janani</span>
                  <small className="text-muted text-xs font-monospace">Administrator</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="container my-4 flex-grow-1">
        {/* Success/Error Alerts */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show shadow-sm border-0 d-flex align-items-center" role="alert">
            <i className="bi bi-check-circle-fill fs-5 me-2"></i>
            <div>{successMessage}</div>
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')} aria-label="Close"></button>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger alert-dismissible fade show shadow-sm border-0 d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
            <div>{errorMessage}</div>
            <button type="button" className="btn-close" onClick={() => setErrorMessage('')} aria-label="Close"></button>
          </div>
        )}

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            {/* Stats Header Bar */}
            <div className="row g-4 mb-4">
              <div className="col-12 col-md-3">
                <div className="glass-card p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted d-block text-xs uppercase font-monospace">Total Articles</span>
                    <h3 className="mb-0 fw-bold">{loading ? '...' : totalRecords}</h3>
                  </div>
                  <div className="rounded-3 bg-primary-subtle p-3 text-primary d-flex align-items-center justify-content-center">
                    <i className="bi bi-files fs-4"></i>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="glass-card p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted d-block text-xs uppercase font-monospace">Active News</span>
                    <h3 className="mb-0 fw-bold text-success">
                      {loading ? '...' : newsList.filter(n => n.Status === 'Active').length}
                    </h3>
                  </div>
                  <div className="rounded-3 bg-success-subtle p-3 text-success d-flex align-items-center justify-content-center">
                    <i className="bi bi-broadcast fs-4"></i>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="glass-card p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted d-block text-xs uppercase font-monospace">Languages Used</span>
                    <h3 className="mb-0 fw-bold text-info">
                      {loading ? '...' : new Set(newsList.filter(n => n.Language).map(n => n.Language)).size}
                    </h3>
                  </div>
                  <div className="rounded-3 bg-info-subtle p-3 text-info d-flex align-items-center justify-content-center">
                    <i className="bi bi-translate fs-4"></i>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="glass-card p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted d-block text-xs uppercase font-monospace">Featured Categories</span>
                    <h3 className="mb-0 fw-bold text-warning">
                      {loading ? '...' : new Set(newsList.map(n => n.Category)).size}
                    </h3>
                  </div>
                  <div className="rounded-3 bg-warning-subtle p-3 text-warning d-flex align-items-center justify-content-center">
                    <i className="bi bi-tags fs-4"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Panel */}
            <div className="glass-card p-4 mb-4">
              <h5 className="mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-funnel text-primary"></i> Filter & Search Records
              </h5>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control border-start-0" 
                      placeholder="Search title, description, city, country..." 
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                  </div>
                </div>

                <div className="col-6 col-md-2">
                  <select 
                    className="form-select" 
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <select 
                    className="form-select" 
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <select 
                    className="form-select" 
                    value={languageFilter}
                    onChange={(e) => { setLanguageFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">All Languages</option>
                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <select 
                    className="form-select" 
                    value={regionFilter}
                    onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">All Regions</option>
                    {REGIONS.map(reg => <option key={reg} value={reg}>{reg}</option>)}
                  </select>
                </div>
              </div>

              {/* Reset Filters & Presentation Toggle Button Row */}
              <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top border-secondary-subtle">
                <button 
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('');
                    setStatusFilter('');
                    setLanguageFilter('');
                    setRegionFilter('');
                    setPage(1);
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise"></i> Reset Filters
                </button>

                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted text-xs font-monospace me-2">Layout:</span>
                  <div className="btn-group btn-group-sm">
                    <button 
                      className={`btn ${layoutMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setLayoutMode('grid')}
                      title="Grid Layout"
                    >
                      <i className="bi bi-grid-3x3-gap-fill"></i>
                    </button>
                    <button 
                      className={`btn ${layoutMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setLayoutMode('list')}
                      title="List Layout"
                    >
                      <i className="bi bi-list-task"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Records Display Grid */}
            {loading ? (
              // Loading Skeleton Layout
              <div className="row g-4">
                {[...Array(limit)].map((_, i) => (
                  <div key={i} className={layoutMode === 'grid' ? 'col-12 col-md-6 col-lg-4' : 'col-12'}>
                    <div className="glass-card p-3" style={{ height: '380px' }}>
                      <div className="skeleton w-100 rounded-3 mb-3" style={{ height: '180px' }}></div>
                      <div className="skeleton w-25 mb-2" style={{ height: '20px' }}></div>
                      <div className="skeleton w-75 mb-3" style={{ height: '28px' }}></div>
                      <div className="skeleton w-100 mb-2" style={{ height: '14px' }}></div>
                      <div className="skeleton w-100 mb-4" style={{ height: '14px' }}></div>
                      <div className="d-flex justify-content-between mt-auto">
                        <div className="skeleton w-25" style={{ height: '30px' }}></div>
                        <div className="skeleton w-25" style={{ height: '30px' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : newsList.length === 0 ? (
              // Empty State
              <div className="glass-card p-5 text-center my-5 d-flex flex-column align-items-center">
                <div className="bg-secondary-subtle rounded-circle p-4 text-secondary mb-3 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-folder-x fs-2"></i>
                </div>
                <h4 className="fw-bold">No Records Found</h4>
                <p className="text-muted max-w-md mx-auto mb-4" style={{ maxWidth: '400px' }}>
                  We couldn't find any news records matching your search queries or active filters. Try resetting the filters or add a new entry.
                </p>
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleAddNewClick}>
                  <i className="bi bi-plus-circle"></i> Add Daily News Entry
                </button>
              </div>
            ) : (
              // Dashboard list/grid contents
              <div className="row g-4">
                {newsList.map((news) => {
                  const hasImage = news.News_Banner_Image && news.News_Banner_Image.length > 0;
                  const firstImage = hasImage ? news.News_Banner_Image[0].path : null;
                  
                  return (
                    <div key={news.News_Id} className={layoutMode === 'grid' ? 'col-12 col-md-6 col-lg-4' : 'col-12 animate-fade-in'}>
                      <div className="glass-card h-100 d-flex flex-column overflow-hidden position-relative">
                        {/* Cover Image / Gradient */}
                        {layoutMode === 'grid' ? (
                          <div className="position-relative" style={{ height: '180px', overflow: 'hidden' }}>
                            {firstImage ? (
                              <img 
                                src={firstImage} 
                                alt={news.News_Title} 
                                className="w-100 h-100 object-fit-cover"
                                style={{ transition: 'transform 0.5s' }}
                              />
                            ) : (
                              <div className="w-100 h-100 bg-gradient-primary opacity-75 d-flex align-items-center justify-content-center">
                                <i className="bi bi-newspaper text-white fs-1"></i>
                              </div>
                            )}
                            {/* Category Badge on top of image */}
                            <span className={`badge position-absolute top-3 start-3 badge-category shadow border ${getCategoryClass(news.Category)}`} style={{ zIndex: 2, top: '12px', left: '12px' }}>
                              {news.Category}
                            </span>
                            {/* Date Badge */}
                            <span className="badge bg-dark bg-opacity-75 text-white position-absolute bottom-3 end-3 font-monospace" style={{ zIndex: 2, bottom: '12px', right: '12px', fontSize: '0.75rem' }}>
                              <i className="bi bi-calendar3 me-1"></i> {news.News_Date}
                            </span>
                          </div>
                        ) : null}

                        {/* Card Body */}
                        <div className="p-4 d-flex flex-column flex-grow-1">
                          {/* List Mode Banner/Header Row */}
                          {layoutMode === 'list' && (
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className={`badge badge-category border ${getCategoryClass(news.Category)}`}>
                                {news.Category}
                              </span>
                              <span className="text-muted text-xs font-monospace">
                                <i className="bi bi-calendar3 me-1"></i> {news.News_Date}
                              </span>
                              <span className="text-muted text-xs ms-auto font-monospace">
                                ID: #{news.News_Id}
                              </span>
                            </div>
                          )}

                          <div className="d-flex align-items-start justify-content-between mb-2">
                            <h5 className="card-title fw-bold mb-0 text-truncate-2-lines pointer-hover" onClick={() => setSelectedNews(news)} title="Click to view details">
                              {news.News_Title}
                            </h5>
                            {layoutMode === 'grid' && (
                              <span className="text-muted text-xs font-monospace">
                                ID: #{news.News_Id}
                              </span>
                            )}
                          </div>

                          <p className="card-text text-muted text-truncate-3-lines mb-3 text-sm" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                            {news.News_Description}
                          </p>

                          {/* Metadata row */}
                          <div className="mt-auto pt-3 border-top border-secondary-subtle">
                            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                              {news.Language && (
                                <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle text-xs py-1">
                                  <i className="bi bi-translate me-1"></i> {news.Language}
                                </span>
                              )}
                              {(news.City || news.Country || news.Region) && (
                                <span className="badge bg-dark-subtle text-dark-emphasis border border-dark-subtle text-xs py-1">
                                  <i className="bi bi-geo-alt me-1 text-danger"></i>
                                  {[news.City, news.Country, news.Region].filter(Boolean).slice(0, 2).join(', ')}
                                </span>
                              )}
                              <span className={`badge rounded-pill text-xs py-1 px-2.5 ms-auto ${news.Status === 'Active' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25'}`}>
                                <span className={`d-inline-block rounded-circle me-1.5 ${news.Status === 'Active' ? 'bg-success' : 'bg-secondary'}`} style={{ width: '6px', height: '6px', transform: 'translateY(-1px)' }}></span>
                                {news.Status}
                              </span>
                            </div>

                            {/* Card actions */}
                            <div className="d-flex justify-content-between gap-2">
                              <button 
                                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 px-3"
                                onClick={() => setSelectedNews(news)}
                              >
                                <i className="bi bi-eye"></i> View
                              </button>
                              
                              <div className="d-flex gap-1.5">
                                <button 
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => handleEditClick(news)}
                                  title="Edit News"
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDelete(news.News_Id)}
                                  title="Delete News"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination controls */}
            {!loading && totalPages > 1 && (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-5 pt-3 border-top border-secondary-subtle">
                <span className="text-muted text-sm">
                  Showing page <strong className="text-body">{page}</strong> of <strong className="text-body">{totalPages}</strong> ({totalRecords} total records)
                </span>

                <nav aria-label="Page navigation">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page - 1)} disabled={page === 1}>
                        <i className="bi bi-chevron-left me-1"></i> Prev
                      </button>
                    </li>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setPage(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                        Next <i className="bi bi-chevron-right ms-1"></i>
                      </button>
                    </li>
                  </ul>
                </nav>

                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted text-sm">Rows per page:</span>
                  <select 
                    className="form-select form-select-sm" 
                    value={limit} 
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    style={{ width: '70px' }}
                  >
                    <option value={3}>3</option>
                    <option value={6}>6</option>
                    <option value={9}>9</option>
                    <option value={12}>12</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Entry Screen (CRUD Form) */}
        {activeTab === 'entry' && (
          <div className="animate-fade-in mx-auto" style={{ maxWidth: '960px' }}>
            {/* Draft restore panel */}
            {draftAlert && (
              <div className="alert alert-info border-0 shadow-sm d-flex flex-column flex-sm-row justify-content-between align-items-sm-center p-3 mb-4 rounded-3 gap-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-journal-text fs-4 me-2"></i>
                  <div>
                    <strong className="d-block">Unsaved Draft Found</strong>
                    <span className="text-sm">You have an unsaved draft from a previous session. Would you like to restore it?</span>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-primary px-3" onClick={restoreDraft}>Restore</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={clearDraft}>Discard</button>
                </div>
              </div>
            )}

            <div className="glass-card p-4 p-md-5">
              <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3 border-secondary-subtle">
                <div>
                  <h3 className="fw-bold mb-1">
                    {editingRecord ? (
                      <>Edit News Record <span className="text-primary font-monospace">#{editingRecord.News_Id}</span></>
                    ) : (
                      'Create Daily News Entry'
                    )}
                  </h3>
                  <p className="text-muted text-sm mb-0">Fill out the form details below to publish daily news. Asterisk (*) denotes required fields.</p>
                </div>

                <button className="btn btn-outline-secondary d-flex align-items-center gap-1.5" onClick={() => { setActiveTab('dashboard'); setEditingRecord(null); }}>
                  <i className="bi bi-arrow-left"></i> Back to Grid
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-4">
                  {/* Left Column: Core Fields */}
                  <div className="col-12 col-lg-7">
                    <h5 className="fw-bold mb-3 text-gradient"><i className="bi bi-info-circle me-1"></i> News Details</h5>

                    {/* Title */}
                    <div className="form-floating mb-3">
                      <input 
                        type="text" 
                        className={`form-control ${validationErrors.title ? 'is-invalid' : ''}`}
                        id="titleInput" 
                        placeholder="Daily Stock Market Updates"
                        value={formTitle}
                        onChange={(e) => { setFormTitle(e.target.value); if(validationErrors.title) setValidationErrors({...validationErrors, title: null}); }}
                      />
                      <label htmlFor="titleInput">News Title *</label>
                      {validationErrors.title && <div className="invalid-feedback">{validationErrors.title}</div>}
                    </div>

                    {/* Description */}
                    <div className="form-floating mb-3">
                      <textarea 
                        className={`form-control ${validationErrors.description ? 'is-invalid' : ''}`} 
                        placeholder="Write detailed news description here..." 
                        id="descInput" 
                        style={{ height: '180px' }}
                        value={formDescription}
                        onChange={(e) => { setFormDescription(e.target.value); if(validationErrors.description) setValidationErrors({...validationErrors, description: null}); }}
                      ></textarea>
                      <label htmlFor="descInput">News Description *</label>
                      {validationErrors.description && <div className="invalid-feedback">{validationErrors.description}</div>}
                    </div>

                    <div className="row g-3 mb-3">
                      {/* Category */}
                      <div className="col-6">
                        <div className="form-floating">
                          <select 
                            className={`form-select ${validationErrors.category ? 'is-invalid' : ''}`} 
                            id="categorySelect"
                            value={formCategory}
                            onChange={(e) => { setFormCategory(e.target.value); if(validationErrors.category) setValidationErrors({...validationErrors, category: null}); }}
                          >
                            <option value="">Choose category</option>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <label htmlFor="categorySelect">Category *</label>
                          {validationErrors.category && <div className="invalid-feedback">{validationErrors.category}</div>}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-6">
                        <div className="form-floating">
                          <input 
                            type="date" 
                            className={`form-control ${validationErrors.date ? 'is-invalid' : ''}`} 
                            id="dateInput"
                            value={formDate}
                            onChange={(e) => { setFormDate(e.target.value); if(validationErrors.date) setValidationErrors({...validationErrors, date: null}); }}
                          />
                          <label htmlFor="dateInput">Publish Date *</label>
                          {validationErrors.date && <div className="invalid-feedback">{validationErrors.date}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      {/* Language */}
                      <div className="col-6">
                        <div className="form-floating">
                          <select 
                            className="form-select" 
                            id="langSelect"
                            value={formLanguage}
                            onChange={(e) => setFormLanguage(e.target.value)}
                          >
                            <option value="">Select Language</option>
                            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                          </select>
                          <label htmlFor="langSelect">Language</label>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-6">
                        <div className="form-floating">
                          <select 
                            className="form-select" 
                            id="statusSelect"
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value)}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                          <label htmlFor="statusSelect">Publish Status</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Geo & Media */}
                  <div className="col-12 col-lg-5">
                    <h5 className="fw-bold mb-3 text-gradient"><i className="bi bi-geo-alt me-1"></i> Regional Targeting</h5>
                    
                    <div className="row g-3 mb-4">
                      <div className="col-12">
                        <div className="form-floating">
                          <select 
                            className="form-select" 
                            id="regionSelect"
                            value={formRegion}
                            onChange={(e) => setFormRegion(e.target.value)}
                          >
                            <option value="">Select Region</option>
                            {REGIONS.map(reg => <option key={reg} value={reg}>{reg}</option>)}
                          </select>
                          <label htmlFor="regionSelect">Region</label>
                        </div>
                      </div>
                      
                      <div className="col-6">
                        <div className="form-floating">
                          <input 
                            type="text" 
                            className="form-control" 
                            id="cityInput" 
                            placeholder="Paris"
                            value={formCity}
                            onChange={(e) => setFormCity(e.target.value)}
                          />
                          <label htmlFor="cityInput">City</label>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="form-floating">
                          <input 
                            type="text" 
                            className="form-control" 
                            id="countryInput" 
                            placeholder="France"
                            value={formCountry}
                            onChange={(e) => setFormCountry(e.target.value)}
                          />
                          <label htmlFor="countryInput">Country</label>
                        </div>
                      </div>
                    </div>

                    <h5 className="fw-bold mb-3 text-gradient"><i className="bi bi-images me-1"></i> Media Assets</h5>
                    
                    {/* Banner Image Upload */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-sm d-flex justify-content-between mb-1">
                        <span>Banner Image(s) <small className="text-muted">(Max 5MB per file)</small></span>
                        <span className="text-xs text-muted">JPG, PNG, WEBP</span>
                      </label>
                      <div className="file-upload-wrapper">
                        <i className="bi bi-cloud-arrow-up fs-2 text-primary d-block mb-1"></i>
                        <span className="text-sm fw-medium d-block text-body">Drag & Drop or Click to Upload</span>
                        <small className="text-muted d-block text-xs">Supports single/multiple image files</small>
                        <input 
                          type="file" 
                          className="file-upload-input" 
                          multiple 
                          accept="image/*"
                          ref={bannerInputRef}
                          onChange={handleBannerChange}
                        />
                      </div>

                      {/* Display Existing Banner Images (Edit Mode) */}
                      {editingRecord && retainedBannerImages.length > 0 && (
                        <div className="mt-3">
                          <small className="text-muted font-monospace d-block mb-2">Retained Images:</small>
                          <div className="row g-2">
                            {retainedBannerImages.map((img, i) => (
                              <div key={i} className="col-4">
                                <div className="file-preview-card">
                                  <img src={img.path} alt={img.name} />
                                  <button type="button" className="file-preview-delete" onClick={() => removeExistingBanner(i)}>
                                    <i className="bi bi-x"></i>
                                  </button>
                                </div>
                                <span className="text-xs text-truncate d-block mt-0.5" style={{ maxWidth: '100%', fontSize: '0.65rem' }}>{img.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Banner Image Previews */}
                      {bannerPreviews.length > 0 && (
                        <div className="mt-3">
                          <small className="text-primary font-monospace d-block mb-2">New Images to Upload:</small>
                          <div className="row g-2">
                            {bannerPreviews.map((preview, i) => (
                              <div key={i} className="col-4 animate-fade-in">
                                <div className="file-preview-card">
                                  <img src={preview.url} alt={preview.name} />
                                  <button type="button" className="file-preview-delete" onClick={() => removeNewBanner(i)}>
                                    <i className="bi bi-x"></i>
                                  </button>
                                </div>
                                <span className="text-xs text-truncate d-block mt-0.5 text-primary" style={{ maxWidth: '100%', fontSize: '0.65rem' }}>{preview.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Videos Upload */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-sm d-flex justify-content-between mb-1">
                        <span>News Video(s) <small className="text-muted">(Max 5MB per file)</small></span>
                        <span className="text-xs text-muted">MP4, WEBM, MOV</span>
                      </label>
                      <div className="file-upload-wrapper">
                        <i className="bi bi-film fs-2 text-primary d-block mb-1"></i>
                        <span className="text-sm fw-medium d-block text-body">Drag & Drop or Click to Upload</span>
                        <small className="text-muted d-block text-xs">Supports single/multiple video files</small>
                        <input 
                          type="file" 
                          className="file-upload-input" 
                          multiple 
                          accept="video/*"
                          ref={videoInputRef}
                          onChange={handleVideoChange}
                        />
                      </div>

                      {/* Display Existing Videos (Edit Mode) */}
                      {editingRecord && retainedVideos.length > 0 && (
                        <div className="mt-3">
                          <small className="text-muted font-monospace d-block mb-2">Retained Videos:</small>
                          <div className="row g-2">
                            {retainedVideos.map((vid, i) => (
                              <div key={i} className="col-4">
                                <div className="file-preview-card">
                                  <video src={vid.path} muted></video>
                                  <button type="button" className="file-preview-delete" onClick={() => removeExistingVideo(i)}>
                                    <i className="bi bi-x"></i>
                                  </button>
                                </div>
                                <span className="text-xs text-truncate d-block mt-0.5" style={{ maxWidth: '100%', fontSize: '0.65rem' }}>{vid.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Videos Previews */}
                      {videoPreviews.length > 0 && (
                        <div className="mt-3">
                          <small className="text-primary font-monospace d-block mb-2">New Videos to Upload:</small>
                          <div className="row g-2">
                            {videoPreviews.map((preview, i) => (
                              <div key={i} className="col-4 animate-fade-in">
                                <div className="file-preview-card">
                                  <video src={preview.url} muted></video>
                                  <button type="button" className="file-preview-delete" onClick={() => removeNewVideo(i)}>
                                    <i className="bi bi-x"></i>
                                  </button>
                                </div>
                                <span className="text-xs text-truncate d-block mt-0.5 text-primary" style={{ maxWidth: '100%', fontSize: '0.65rem' }}>{preview.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Panel */}
                <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top border-secondary-subtle">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary px-4 py-2" 
                    onClick={() => { setActiveTab('dashboard'); setEditingRecord(null); }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary bg-gradient-primary border-0 px-5 py-2 d-flex align-items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i>
                        {editingRecord ? 'Save Changes' : 'Publish News'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 mt-auto border-top border-secondary-subtle bg-body-tertiary">
        <div className="container d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
          <span className="text-muted text-xs font-monospace">PulseNews &copy; 2026. Made for Daily News Management.</span>
          <span className="badge bg-secondary-subtle text-secondary font-monospace text-xs">PHP Backend / React Frontend / Bootstrap 5 / jQuery AJAX</span>
        </div>
      </footer>

      {/* News Details Modal Dialog */}
      {selectedNews && (
        <div className="modal show d-block glass-modal animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-bottom-0 pb-0">
                <span className={`badge badge-category border ${getCategoryClass(selectedNews.Category)}`}>
                  {selectedNews.Category}
                </span>
                <span className="text-muted text-xs font-monospace ms-3">
                  <i className="bi bi-calendar3 me-1"></i> {selectedNews.News_Date}
                </span>
                <button type="button" className="btn-close ms-auto shadow-none" onClick={() => setSelectedNews(null)}></button>
              </div>

              <div className="modal-body p-4 pt-3">
                <h3 className="fw-bold mb-3">{selectedNews.News_Title}</h3>

                {/* Image Gallery/Carousel */}
                {selectedNews.News_Banner_Image && selectedNews.News_Banner_Image.length > 0 && (
                  <div className="mb-4 rounded-3 overflow-hidden shadow-sm" style={{ maxHeight: '400px' }}>
                    <div id="modalCarousel" className="carousel slide" data-bs-ride="carousel">
                      <div className="carousel-inner">
                        {selectedNews.News_Banner_Image.map((img, idx) => (
                          <div key={idx} className={`carousel-item ${idx === 0 ? 'active' : ''}`} style={{ height: '360px' }}>
                            <img src={img.path} className="d-block w-100 h-100 object-fit-cover" alt={img.name} />
                          </div>
                        ))}
                      </div>
                      {selectedNews.News_Banner_Image.length > 1 && (
                        <>
                          <button className="carousel-control-prev" type="button" data-bs-target="#modalCarousel" data-bs-slide="prev">
                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                          </button>
                          <button className="carousel-control-next" type="button" data-bs-target="#modalCarousel" data-bs-slide="next">
                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* News Description */}
                <p className="lead fs-6 text-body mb-4" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                  {selectedNews.News_Description}
                </p>

                {/* Videos Section */}
                {selectedNews.News_Videos && selectedNews.News_Videos.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-2"><i className="bi bi-film me-1"></i> Attached Videos ({selectedNews.News_Videos.length})</h6>
                    <div className="row g-3">
                      {selectedNews.News_Videos.map((vid, idx) => (
                        <div key={idx} className="col-12 col-sm-6">
                          <div className="card bg-dark border-0 rounded-3 overflow-hidden">
                            <video src={vid.path} controls className="w-100" style={{ maxHeight: '180px' }}></video>
                            <div className="p-2 text-white text-xs text-truncate">{vid.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta details list */}
                <div className="p-3 bg-secondary bg-opacity-5 rounded-3 border border-secondary-subtle">
                  <div className="row g-3 text-sm">
                    <div className="col-6 col-sm-3">
                      <span className="text-muted d-block text-xs uppercase font-monospace">Region</span>
                      <strong className="text-body">{selectedNews.Region || 'N/A'}</strong>
                    </div>
                    <div className="col-6 col-sm-3">
                      <span className="text-muted d-block text-xs uppercase font-monospace">Language</span>
                      <strong className="text-body">{selectedNews.Language || 'N/A'}</strong>
                    </div>
                    <div className="col-6 col-sm-3">
                      <span className="text-muted d-block text-xs uppercase font-monospace">City / Country</span>
                      <strong className="text-body">
                        {[selectedNews.City, selectedNews.Country].filter(Boolean).join(', ') || 'N/A'}
                      </strong>
                    </div>
                    <div className="col-6 col-sm-3">
                      <span className="text-muted d-block text-xs uppercase font-monospace">Status</span>
                      <span className={`badge ${selectedNews.Status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedNews.Status}
                      </span>
                    </div>
                    
                    <div className="col-12 border-top border-secondary-subtle pt-2 mt-2">
                      <div className="d-flex flex-wrap justify-content-between text-xs text-muted">
                        <span>Created: <strong>{selectedNews.CreatedOn}</strong> by <strong>{selectedNews.CreatedBy || 'N/A'}</strong></span>
                        {selectedNews.UpdatedOn && selectedNews.UpdatedOn !== selectedNews.CreatedOn && (
                          <span>Updated: <strong>{selectedNews.UpdatedOn}</strong> by <strong>{selectedNews.UpdatedBy || 'N/A'}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedNews(null)}>Close</button>
                <button 
                  type="button" 
                  className="btn btn-primary bg-gradient-primary border-0" 
                  onClick={() => {
                    handleEditClick(selectedNews);
                    setSelectedNews(null);
                  }}
                >
                  Edit Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
