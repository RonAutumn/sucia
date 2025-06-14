import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../src/utils/supabase';
import DashboardLayout from '../src/components/layout/DashboardLayout';

interface Service {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'busy' | 'offline';
  description: string;
  estimated_wait_time: number;
  location: string;
  price: string;
  created_at: string;
  updated_at: string;
}

const statusColors = {
  available: 'bg-green-100 text-green-800',
  busy: 'bg-yellow-100 text-yellow-800',
  offline: 'bg-red-100 text-red-800'
};

const statusIcons = {
  available: '✅',
  busy: '⏳',
  offline: '❌'
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching services:', error);
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const openBookingModal = (service: Service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout title="Services">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Our Services - SuciaMVP</title>
        <meta name="description" content="Premium massage and wellness services" />
      </Head>

      <DashboardLayout title="Services">
        <div className="bg-gray-50 -mt-4">

          {/* Services Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden border-2 border-red-100"
                >
                  {/* Service Type Badge */}
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 px-4 py-3">
                    <span className="text-white font-bold text-sm uppercase tracking-wide">
                      {service.type.replace(/adult\s*/gi, '').trim()}
                    </span>
                  </div>

                  <div className="p-6">
                    {/* Service Name & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 flex-1">
                        {service.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[service.status]}`}>
                        {statusIcons[service.status]} {service.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Details Grid */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 font-medium">⏱️ Duration:</span>
                        <span className="text-sm font-bold">{service.estimated_wait_time} min</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => openBookingModal(service)}
                      disabled={service.status === 'offline'}
                      className={`w-full py-3 px-4 rounded-lg font-bold text-sm uppercase tracking-wide transition-colors ${
                        service.status === 'offline'
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-yellow-500 text-white hover:bg-yellow-600'
                      }`}
                    >
                      {service.status === 'offline' ? 'Currently Unavailable' : 'Join Waitlist'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {services.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No services available at the moment.</p>
              </div>
            )}
          </div>

          {/* Booking Modal */}
          {showBookingModal && selectedService && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Join Waitlist</h3>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-lg text-red-600">{selectedService.name}</h4>
                  <p className="text-gray-600 text-sm mt-1">{selectedService.description}</p>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm"><span className="font-medium">Duration:</span> {selectedService.estimated_wait_time} minutes</p>
                  </div>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={3}
                      placeholder="Any special requests or preferences..."
                    />
                  </div>
                </form>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert('Added to waitlist! We will contact you when a spot becomes available.');
                      setShowBookingModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold"
                  >
                    Join Waitlist
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}