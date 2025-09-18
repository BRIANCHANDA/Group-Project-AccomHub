import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./bootstrap-5.3.5-dist/css/bootstrap.min.css";

const RegistrationForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "",
  });

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    userType?: string;
  }>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll handler (consistent with home page)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (menuOpen && !event.target.closest(".navbar")) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  // Enhanced email validation
  const validateEmail = (email: string) => {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  // Enhanced phone number validation (supports multiple formats)
  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const patterns = [
      /^\d{10}$/, // 1234567890
      /^\d{11}$/, // 12345678901 (with country code)
      /^\d{12}$/, // 123456789012 (international format)
    ];
    return (
      patterns.some((pattern) => pattern.test(cleaned)) && cleaned.length >= 10
    );
  };

  // Enhanced password validation with strength checking
  const validatePassword = (password: string) => {
    const minLength = 8;
    const feedback = [];
    let score = 0;

    if (password.length < minLength) {
      feedback.push(`Password must be at least ${minLength} characters long`);
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push("Password must contain at least one lowercase letter");
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push("Password must contain at least one uppercase letter");
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push("Password must contain at least one number");
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push(
        "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
      );
    } else {
      score += 1;
    }

    const commonPatterns = [/qwerty/i, /abc123/i, /(.)\1{2,}/];

    if (commonPatterns.some((pattern) => pattern.test(password))) {
      feedback.push("Password contains common patterns that should be avoided");
      score = Math.max(0, score - 1);
    }

    return { score, feedback, isValid: score >= 5 && feedback.length === 0 };
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      const strength = validatePassword(value);
      setPasswordStrength(strength);
    }

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleNavigation = (path: string) => {
    const paths: Record<string, string> = {
      signin: "/login",
      home: "/",
      about: "/about",
      viewall: "/studentdashboard",
    };

    if (paths[path]) {
      navigate(paths[path]);
    } else {
      navigate(`/${path}`);
    }
    setMenuOpen(false);
  };

  const validate = () => {
    const newErrors: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      userType?: string;
    } = {};

    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName.trim())) {
      newErrors.firstName =
        "First name can only contain letters, spaces, hyphens, and apostrophes";
    }

    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName.trim())) {
      newErrors.lastName =
        "Last name can only contain letters, spaces, hyphens, and apostrophes";
    }

    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      if (!validatePhoneNumber(formData.phoneNumber)) {
        newErrors.phoneNumber =
          "Please enter a valid phone number (10-12 digits)";
      }
    }

    if (!formData.email || formData.email.trim() === "") {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password =
          passwordValidation.feedback[0] ||
          "Password does not meet security requirements";
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (
      !formData.userType ||
      !["student", "landlord"].includes(formData.userType)
    ) {
      newErrors.userType = "Please select a valid user type";
    }

    return newErrors;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setFormError("");
    const validationErrors = validate();

    if (Object.keys(validationErrors).length === 0) {
      setIsLoading(true);

      try {
        const registerData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          userType: formData.userType,
          ...(formData.phoneNumber &&
            formData.phoneNumber.trim() && {
              phoneNumber: formData.phoneNumber.replace(/\D/g, ""),
            }),
        };

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Registration failed");
        }

        setIsLoading(false);

        // Show success message
        const alertDiv = document.createElement("div");
        alertDiv.className = "alert alert-success position-fixed";
        alertDiv.style.cssText =
          "top: 100px; right: 20px; z-index: 9999; animation: slideInRight 0.3s ease-out;";
        alertDiv.innerHTML =
          "<strong>Success!</strong> Account created successfully. Redirecting...";
        document.body.appendChild(alertDiv);

        setTimeout(() => {
          document.body.removeChild(alertDiv);
          navigate("/login");
        }, 2000);
      } catch (error) {
        setIsLoading(false);

        if (
          error instanceof Error &&
          error.message.includes("Email already exists")
        ) {
          setErrors((prev) => ({
            ...prev,
            email: "This email is already registered",
          }));
          setFormError("An account with this email already exists");
        } else {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          setFormError(`Registration failed: ${errorMessage}`);
        }
      }
    } else {
      setErrors(validationErrors);
      setFormError("Please correct the errors in the form");
    }
  };

  const getPasswordStrengthInfo = () => {
    if (!formData.password) return { color: "#dee2e6", text: "", width: 0 };

    const { score } = passwordStrength;

    if (score <= 1) return { color: "#dc3545", text: "Very Weak", width: 20 };
    if (score === 2) return { color: "#fd7e14", text: "Weak", width: 40 };
    if (score === 3) return { color: "#ffc107", text: "Fair", width: 60 };
    if (score === 4) return { color: "#28a745", text: "Good", width: 80 };
    return { color: "#198754", text: "Strong", width: 100 };
  };

  return (
    <div className="app-container w-100 min-vh-100">
      {/* NAVBAR - Same as Home */}
      <nav
        className={`navbar navbar-expand-lg fixed-top navbar-light bg-white shadow-sm ${
          isScrolled ? "scrolled" : ""
        }`}
      >
        <div className="container-lg">
          <a
            className="navbar-brand fw-bold text-primary d-flex align-items-center"
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavigation("home");
            }}
          >
            <span className="me-1">🏠</span>
            <span>PlacesForLeaners</span>
          </a>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-controls="navbarNav"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}
            id="navbarNav"
          >
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation("home");
                  }}
                >
                  Home
                </a>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => handleNavigation("signin")}
              >
                Sign In
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleNavigation("home")}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main
        className="py-4 py-md-5"
        style={{ paddingTop: "120px", marginTop: "20px" }}
      >
        <div className="container-lg">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6">
              {/* Header */}
              <div className="text-center mb-4">
                <h1 className="h3 fw-bold mb-2 text-dark">
                  Create Your Account
                </h1>
                <p className="text-muted mb-0">
                  Join PlacesForLeaners to find your perfect student
                  accommodation
                </p>
              </div>

              {/* Form Card */}
              <div className="card shadow-sm border-0">
                <div className="card-body p-4">
                  {formError && (
                    <div className="alert alert-danger d-flex align-items-center mb-4">
                      <i className="bi bi-exclamation-circle-fill me-2"></i>
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-medium small">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`form-control form-control-sm ${
                            errors.firstName ? "is-invalid" : ""
                          }`}
                          placeholder="Enter your first name"
                        />
                        {errors.firstName && (
                          <div className="invalid-feedback small">
                            {errors.firstName}
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium small">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`form-control form-control-sm ${
                            errors.lastName ? "is-invalid" : ""
                          }`}
                          placeholder="Enter your last name"
                        />
                        {errors.lastName && (
                          <div className="invalid-feedback small">
                            {errors.lastName}
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium small">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          className={`form-control form-control-sm ${
                            errors.phoneNumber ? "is-invalid" : ""
                          }`}
                          placeholder="e.g., +260 971 234567"
                        />
                        {errors.phoneNumber && (
                          <div className="invalid-feedback small">
                            {errors.phoneNumber}
                          </div>
                        )}
                        <div className="form-text small">
                          Enter 10-12 digits (with or without country code)
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium small">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`form-control form-control-sm ${
                            errors.email ? "is-invalid" : ""
                          }`}
                          placeholder="Enter your email address"
                        />
                        {errors.email && (
                          <div className="invalid-feedback small">
                            {errors.email}
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium small">
                          Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`form-control form-control-sm ${
                            errors.password ? "is-invalid" : ""
                          }`}
                          placeholder="Create a strong password"
                        />
                        {errors.password && (
                          <div className="invalid-feedback small">
                            {errors.password}
                          </div>
                        )}

                        {/* Password Strength Indicator */}
                        {formData.password && (
                          <div className="mt-2">
                            <div className="progress" style={{ height: "3px" }}>
                              <div
                                className="progress-bar"
                                style={{
                                  width: `${getPasswordStrengthInfo().width}%`,
                                  backgroundColor:
                                    getPasswordStrengthInfo().color,
                                }}
                              ></div>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <small
                                style={{
                                  color: getPasswordStrengthInfo().color,
                                  fontSize: "0.75rem",
                                }}
                              >
                                {getPasswordStrengthInfo().text}
                              </small>
                            </div>
                            {passwordStrength.feedback.length > 0 && (
                              <div className="mt-2 p-2 bg-light rounded">
                                <small
                                  className="text-muted"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  Password requirements:
                                </small>
                                <ul
                                  className="mb-0 mt-1"
                                  style={{ fontSize: "0.7rem" }}
                                >
                                  {passwordStrength.feedback.map(
                                    (feedback, index) => (
                                      <li key={index} className="text-danger">
                                        {feedback}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium small">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`form-control form-control-sm ${
                            errors.confirmPassword ? "is-invalid" : ""
                          }`}
                          placeholder="Confirm your password"
                        />
                        {errors.confirmPassword && (
                          <div className="invalid-feedback small">
                            {errors.confirmPassword}
                          </div>
                        )}
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-medium small">
                          Register as
                        </label>
                        <select
                          name="userType"
                          value={formData.userType}
                          onChange={handleChange}
                          className={`form-select form-select-sm ${
                            errors.userType ? "is-invalid" : ""
                          }`}
                        >
                          <option value="">Select role</option>
                          <option value="student">Student</option>
                          <option value="landlord">Landlord</option>
                        </select>
                        {errors.userType && (
                          <div className="invalid-feedback small">
                            {errors.userType}
                          </div>
                        )}
                      </div>

                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="termsCheck"
                            required
                          />
                          <label
                            className="form-check-label small"
                            htmlFor="termsCheck"
                          >
                            I agree to the{" "}
                            <a href="#" className="text-primary">
                              Terms & Conditions
                            </a>{" "}
                            and{" "}
                            <a href="#" className="text-primary">
                              Privacy Policy
                            </a>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary w-100 py-2"
                      >
                        {isLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Creating Your Account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </button>
                    </div>

                    <div className="mt-3 text-center">
                      <span className="text-muted me-2 small">
                        Already have an account?
                      </span>
                      <button
                        type="button"
                        className="btn btn-link p-0 small"
                        onClick={() => handleNavigation("signin")}
                      >
                        Sign in here
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-center mt-4">
                <div className="row g-2">
                  <div className="col-4">
                    <div className="card text-center border-0 bg-light h-100">
                      <div className="card-body py-2">
                        <div className="text-primary fw-bold small">300+</div>
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Verified Listings
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="card text-center border-0 bg-light h-100">
                      <div className="card-body py-2">
                        <div className="text-success fw-bold small">24/7</div>
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Support
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="card text-center border-0 bg-light h-100">
                      <div className="card-body py-2">
                        <div className="text-info fw-bold small">Free</div>
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          To Join
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER - Same as Home */}
      <footer className="py-4 bg-dark text-white mt-auto">
        <div className="container-lg">
          <div className="row g-4">
            <div className="col-12 col-md-6 text-center text-md-start">
              <h5 className="fw-bold mb-2">🏠 PlacesForLeaners</h5>
              <p className="small mb-0">
                Trusted student housing platform for CBU students in Kitwe
              </p>
            </div>
            <div className="col-12 col-md-6">
              <div className="row g-3">
                <div className="col-6 text-center">
                  <h6 className="small fw-bold mb-2">Quick Links</h6>
                  <div className="d-flex flex-column">
                    <a
                      href="#"
                      className="text-decoration-none text-white-50 small mb-1"
                      onClick={() => handleNavigation("home")}
                    >
                      Home
                    </a>
                    <button
                      className="btn btn-link p-0 text-start text-white-50 small mb-1 text-decoration-none"
                      onClick={() => handleNavigation("viewall")}
                    >
                      Browse Properties
                    </button>
                    <a
                      href="#"
                      className="text-decoration-none text-white-50 small mb-1"
                      onClick={() => handleNavigation("signin")}
                    >
                      Sign In
                    </a>
                  </div>
                </div>
                <div className="col-6 text-center">
                  <h6 className="small fw-bold mb-2">Support</h6>
                  <div className="d-flex flex-column">
                    {["Help", "FAQs", "Contact"].map((link) => (
                      <a
                        href="#"
                        className="text-decoration-none text-white-50 small mb-1"
                        key={link}
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12">
              <hr className="border-secondary my-3" />
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center">
                <p className="small text-white-50 mb-2 mb-sm-0">
                  © {new Date().getFullYear()} PlacesForLeaners. All rights
                  reserved.
                </p>
                <div className="d-flex gap-3 align-items-center">
                  <a
                    href="#"
                    className="text-white-50 text-decoration-none small"
                  >
                    Privacy
                  </a>
                  <a
                    href="#"
                    className="text-white-50 text-decoration-none small"
                  >
                    Terms
                  </a>
                  <span className="text-white-50">•</span>
                  <button
                    className="btn btn-link p-0 text-white-50 small text-decoration-underline"
                    onClick={() => handleNavigation("viewall")}
                  >
                    Browse All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .form-control.custom-input, .form-select.custom-select {
          border-radius: 6px;
          border: 1px solid #dee2e6;
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
          height: 32px;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }

        .form-control.custom-input:focus, .form-select.custom-select:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
          outline: 0;
        }

        .form-select.custom-select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 12px 9px;
          padding-right: 2rem;
        }

        .form-label.small {
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .btn-primary {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        .btn-primary:hover {
          background-color: #0b5ed7;
          border-color: #0a58ca;
        }

        .btn-outline-primary {
          color: #0d6efd;
          border-color: #0d6efd;
        }

        .btn-outline-primary:hover {
          background-color: #0d6efd;
          border-color: #0d6efd;
          color: #fff;
        }

        .navbar.scrolled {
          background-color: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(10px);
        }

        .card {
          border-radius: 12px;
        }

        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        main {
          flex: 1;
        }

        .invalid-feedback.small {
          font-size: 0.75rem;
        }

        .form-text.small {
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default RegistrationForm;
