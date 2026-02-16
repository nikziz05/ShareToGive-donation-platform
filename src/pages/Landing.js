import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Package, Users, TrendingUp, ArrowRight, CheckCircle, Globe, Award, Clock, Shield, ChevronDown } from 'lucide-react';
import donor from '../assets/images/testimonials/donor.jpg';
import volunteer from '../assets/images/testimonials/volunteer.jpg';
import beneficiary from '../assets/images/testimonials/beneficiary.jpg';

const Landing = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Check which sections are visible
      const sections = ['hero', 'features', 'impact', 'how-it-works', 'testimonials', 'cta'];
      const newVisible = {};
      
      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          newVisible[section] = rect.top < window.innerHeight * 0.75;
        }
      });
      
      setIsVisible(newVisible);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { label: 'Donations Received', value: '12,500+', icon: Package },
    { label: 'Lives Impacted', value: '50,000+', icon: Users },
    { label: 'Active Volunteers', value: '250+', icon: Award },
    { label: 'Success Rate', value: '98%', icon: TrendingUp }
  ];

  const features = [
    {
      icon: Package,
      title: 'Easy Donations',
      description: 'Donate money or physical items with just a few clicks. Track your impact in real-time.',
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Choose pickup or drop-off. We work around your schedule, not the other way around.',
      gradient: 'from-green-400 to-green-600'
    },
    {
      icon: Shield,
      title: 'Transparent & Secure',
      description: 'Every donation is tracked. See exactly where your contribution goes and who it helps.',
      gradient: 'from-purple-400 to-purple-600'
    },
    {
      icon: Users,
      title: 'Volunteer Network',
      description: 'Join our community of volunteers. Make a difference with your time and skills.',
      gradient: 'from-orange-400 to-orange-600'
    }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Browse Needs',
      description: 'Explore current community needs and find causes that resonate with you.',
      icon: Globe
    },
    {
      step: '02',
      title: 'Make Your Donation',
      description: 'Choose to donate money or physical items. Schedule pickup or drop-off.',
      icon: Heart
    },
    {
      step: '03',
      title: 'Track Impact',
      description: 'Monitor your contribution journey and see the real-world impact you\'re making.',
      icon: TrendingUp
    }
  ];

  const testimonials = [
    {
      name: 'Rain',
      role: 'Monthly Donor',
      image: donor,
      quote: 'KindNest made donating so easy! I love that I can schedule pickups.',
      rating: 5
    },
    {
      name: 'Alok',
      role: 'Volunteer',
      image: volunteer,
      quote: 'Being a volunteer has been incredibly rewarding. The platform makes coordination seamless.',
      rating: 5
    },
    {
      name: 'Vayu Bagga',
      role: 'Beneficiary',
      image: beneficiary,
      quote: 'KindNest helped our family during tough times. Their transparency and efficiency is remarkable.',
      rating: 5
    }
  ];

  return (
    <div className="bg-white overflow-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white shadow-lg py-2' : 'bg-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center transition-transform duration-300 ${
                scrollY > 50 ? 'scale-90' : 'scale-100'
              }`}>
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className={`font-bold transition-all duration-300 ${
                scrollY > 50 ? 'text-xl text-gray-800' : 'text-2xl text-white'
              }`}>
                KindNest
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`font-medium transition-colors ${
                scrollY > 50 ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
              }`}>
                Features
              </a>
              <a href="#how-it-works" className={`font-medium transition-colors ${
                scrollY > 50 ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
              }`}>
                How It Works
              </a>
              <a href="#impact" className={`font-medium transition-colors ${
                scrollY > 50 ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
              }`}>
                Our Impact
              </a>
              <Link
                to="/volunteer-registration"
                className={`font-medium transition-colors ${
                  scrollY > 50 ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
                }`}
              >
                Volunteer
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  scrollY > 50
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:shadow-lg'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        id="hero" 
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-green-500 overflow-hidden"
      >
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"
            style={{
              top: '10%',
              left: '10%',
              transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px)`
            }}
          />
          <div 
            className="absolute w-96 h-96 bg-green-300 opacity-10 rounded-full blur-3xl"
            style={{
              bottom: '10%',
              right: '10%',
              transform: `translate(${-scrollY * 0.1}px, ${-scrollY * 0.15}px)`
            }}
          />
          <div 
            className="absolute w-64 h-64 bg-blue-300 opacity-10 rounded-full blur-3xl"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.08}px) rotate(${scrollY * 0.1}deg)`
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div 
            className="transition-all duration-1000"
            style={{
              opacity: 1 - scrollY / 500,
              transform: `translateY(${scrollY * 0.3}px)`
            }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Connecting Generosity
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-green-200">
                With Those in Need
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join our community of donors and volunteers making real impact. 
              Every donation, big or small, transforms lives.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                to="/login"
                className="group px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Start Donating</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/volunteer-registration"
                className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center space-x-2"
              >
                <span>Become a Volunteer</span>
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 transform hover:scale-105 transition-transform"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  <stat.icon className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-blue-100 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce"
            style={{
              opacity: 1 - scrollY / 300
            }}
          >
            <ChevronDown className="w-8 h-8 text-white" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        className={`py-20 bg-gray-50 transition-all duration-1000 ${
          isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Why Choose KindNest?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We've built the most intuitive, transparent, and impactful donation platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                style={{
                  animationDelay: `${index * 100}ms`,
                  transform: `translateY(${scrollY * 0.02}px)`
                }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        id="how-it-works" 
        className={`py-20 bg-white transition-all duration-1000 ${
          isVisible['how-it-works'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Making a difference has never been easier. Just three simple steps.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 transform -translate-y-1/2" />

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {howItWorks.map((step, index) => (
                <div
                  key={index}
                  className="text-center"
                  style={{
                    animationDelay: `${index * 200}ms`
                  }}
                >
                  <div className="relative inline-block mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-xl mx-auto transform hover:scale-110 transition-transform">
                      <step.icon className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section 
        id="impact" 
        className={`py-20 bg-gradient-to-br from-blue-600 to-green-600 text-white transition-all duration-1000 ${
          isVisible.impact ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Together, we're creating real change in communities across India
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                { icon: CheckCircle, text: 'Over 50,000 lives directly impacted' },
                { icon: CheckCircle, text: '12,500+ donations successfully delivered' },
                { icon: CheckCircle, text: '250+ active volunteers nationwide' },
                { icon: CheckCircle, text: '98% donor satisfaction rate' },
                { icon: CheckCircle, text: 'Zero overhead - 100% goes to beneficiaries' }
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <item.icon className="w-8 h-8 text-yellow-300 flex-shrink-0" />
                  <span className="text-lg">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6">Real Stories, Real Impact</h3>
                <div className="space-y-4">
                  <div className="bg-white bg-opacity-10 rounded-xl p-4">
                    <p className="italic mb-2">"KindNest helped us provide warm clothes to 500 children this winter."</p>
                    <p className="text-sm text-blue-200">- Local School, Patiala</p>
                  </div>
                  <div className="bg-white bg-opacity-10 rounded-xl p-4">
                    <p className="italic mb-2">"The food donations sustained 200 families during the pandemic."</p>
                    <p className="text-sm text-blue-200">- Community Center, Punjab</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        id="testimonials" 
        className={`py-20 bg-gray-50 transition-all duration-1000 ${
          isVisible.testimonials ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              What People Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from our community members
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2"
              >
                <div className="flex items-center mb-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-16 h-16 rounded-full object-cover mr-4 border-4 border-blue-100" />
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        id="cta" 
        className={`py-20 bg-gradient-to-r from-blue-600 to-green-600 text-white transition-all duration-1000 ${
          isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of donors and volunteers creating positive change every day
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/login"
              className="group px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/volunteer-registration"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
            >
              Volunteer With Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">KindNest</span>
              </div>
              <p className="text-sm">
                Connecting generosity with those in need. Making the world a better place, one donation at a time.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#impact" className="hover:text-white transition-colors">Our Impact</a></li>
                <li><Link to="/volunteer-registration" className="hover:text-white transition-colors">Volunteer</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li>📧 kindnestorg1@gmail.com</li>
                <li>📞 +91 12345 XXXXX</li>
                <li>📍 Patiala, Punjab, India</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Get Started</h3>
              <Link
                to="/login"
                className="block w-full bg-gradient-to-r from-blue-500 to-green-500 text-white text-center px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Join KindNest
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 KindNest Foundation. All rights reserved.</p>
            <p className="mt-2 text-gray-500">Made with ❤️ for the community</p>
            <p></p>
            <p className="mt-2 text-gray-500">Created by: Nikita Shakya</p>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #10b981);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #059669);
        }
      `}</style>
    </div>
  );
};

export default Landing;