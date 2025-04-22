document.addEventListener('DOMContentLoaded', function() {
    // Modal functionality
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const ctaSignupBtn = document.getElementById('ctaSignupBtn');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    
    // User type selection
    const userTypeOptions = document.querySelectorAll('.user-type-option');
    const doctorFields = document.getElementById('doctorFields');
    const patientFields = document.getElementById('patientFields');
    
    // Mobile navigation
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    // Open login modal
    loginBtn.addEventListener('click', function() {
        loginModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Open register modal
    registerBtn.addEventListener('click', function() {
        registerModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Get started button opens register modal
    getStartedBtn.addEventListener('click', function() {
        registerModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // CTA signup button opens register modal
    ctaSignupBtn.addEventListener('click', function() {
        registerModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close modals
    closeModalBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (event.target === registerModal) {
            registerModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Switch between login and register modals
    switchToRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginModal.style.display = 'none';
        registerModal.style.display = 'block';
    });
    
    switchToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerModal.style.display = 'none';
        loginModal.style.display = 'block';
    });
    
    // User type selection
    userTypeOptions.forEach(function(option) {
        option.addEventListener('click', function() {
            // Remove active class from all options
            userTypeOptions.forEach(function(opt) {
                opt.classList.remove('active');
            });
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Show/hide fields based on user type
            const userType = this.getAttribute('data-type');
            if (userType === 'doctor') {
                doctorFields.classList.remove('hidden');
                patientFields.classList.add('hidden');
            } else {
                doctorFields.classList.add('hidden');
                patientFields.classList.remove('hidden');
            }
        });
    });
    
    // Mobile navigation toggle
    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('show');
        authButtons.classList.toggle('show');
        
        // Add mobile navigation styles dynamically
        if (navLinks.classList.contains('show')) {
            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '80px';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.backgroundColor = 'var(--white)';
            navLinks.style.padding = '1rem';
            navLinks.style.boxShadow = 'var(--shadow)';
            
            authButtons.style.display = 'flex';
            authButtons.style.flexDirection = 'column';
            authButtons.style.position = 'absolute';
            authButtons.style.top = `${navLinks.offsetHeight + 80}px`;
            authButtons.style.left = '0';
            authButtons.style.width = '100%';
            authButtons.style.backgroundColor = 'var(--white)';
            authButtons.style.padding = '1rem';
            authButtons.style.boxShadow = 'var(--shadow)';
        } else {
            navLinks.style.display = '';
            authButtons.style.display = '';
        }
    });
// registration fo user 
    document.getElementById("registerForm").addEventListener("submit", async (event) => {
        event.preventDefault();
      
        const formData = {
          username: document.getElementById("registerName").value,
          email: document.getElementById("registerEmail").value,
          password: document.getElementById("registerPassword").value,
        };
      
        // Check if doctor fields are visible
        if (!document.getElementById("doctorFields").classList.contains("hidden")) {
          formData.specialization = document.getElementById("specialization").value;
          formData.licenseNumber = document.getElementById("licenseNumber").value;
          formData.experience = document.getElementById("experience").value;
        } else {
          formData.dateOfBirth = document.getElementById("dateOfBirth").value;
          formData.gender = document.getElementById("gender").value;
        }
      
        const endpoint = formData.specialization ? "/registerdoctor" : "/registerpatient";
      
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      
        const result = await response.json();
        alert(result.message);
      });
      document.getElementById("loginForm").addEventListener("submit", async (event) => {
          event.preventDefault();
        
          const formData = {
            email: document.getElementById("loginEmail").value,
            password: document.getElementById("loginPassword").value,
          };
        
          const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Redirect based on role
            if (result.role === "patient") {
                window.location.href = "/patient-dashboard";
            } else {
                window.location.href = "/doctor-dashboard";
            }
        } else {
            alert(result.error);
        }
        });
    })   
// login of user 
  