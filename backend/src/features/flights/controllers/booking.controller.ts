import { Request, Response } from 'express';
import amadeusService from '../services/amadeus.service';

export const bookingController = {
  /**
   * Complete booking flow: Search → Price → Book
   */
  async createBooking(req: Request, res: Response) {
    try {
      const {
        // Search parameters
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        cabinClass,
        // Selected flight offer (from frontend after user selection)
        selectedOffer,
        // Passenger details
        travelerDetails,
        contactDetails
      } = req.body;

      // Step 1: If no selected offer, search for flights first
      if (!selectedOffer) {
        return res.status(400).json({
          error: 'No flight selected. Please search and select a flight first.'
        });
      }

      // Step 2: Confirm price
      console.log('Step 2: Confirming flight price...');
      const priceConfirmation = await amadeusService.confirmFlightPrice(
        [selectedOffer],
        travelerDetails
      );

      if (!priceConfirmation?.flightOffers?.[0]) {
        return res.status(400).json({
          error: 'Could not confirm flight price. Please try again.'
        });
      }

      const confirmedOffer = priceConfirmation.flightOffers[0];
      
      // Check if price changed
      const originalPrice = parseFloat(selectedOffer.price.total);
      const confirmedPrice = parseFloat(confirmedOffer.price.total);
      
      if (Math.abs(originalPrice - confirmedPrice) > 0.01) {
        return res.status(409).json({
          error: 'PRICE_CHANGED',
          message: `Price has changed from ${selectedOffer.price.currency} ${originalPrice} to ${confirmedOffer.price.currency} ${confirmedPrice}`,
          originalPrice,
          newPrice: confirmedPrice,
          priceDifference: confirmedPrice - originalPrice,
          confirmedOffer: confirmedOffer
        });
      }

      // Step 3: Create booking
      console.log('Step 3: Creating booking...');
      const booking = await amadeusService.createFlightBooking(
        confirmedOffer,
        travelerDetails,
        contactDetails
      );

      // Return successful booking
      return res.status(201).json({
        success: true,
        message: 'Flight booked successfully!',
        booking: {
          id: booking.id,
          pnr: booking.associatedRecords?.[0]?.reference,
          price: booking.flightOffers?.[0]?.price,
          travelers: booking.travelers,
          itineraries: booking.flightOffers?.[0]?.itineraries,
          ticketingDeadline: booking.ticketingAgreement?.delay
        }
      });

    } catch (error: any) {
      console.error('Booking error:', error);
      
      // Handle specific errors
      if (error.message.includes('Price has changed')) {
        return res.status(409).json({
          error: 'PRICE_CHANGED',
          message: error.message
        });
      }
      
      if (error.message.includes('self-service mode')) {
        return res.status(403).json({
          error: 'PAYMENT_NOT_ALLOWED',
          message: 'Direct payment is not allowed in self-service mode. Please work with an airline consolidator for ticketing.'
        });
      }
      
      return res.status(500).json({
        error: 'BOOKING_FAILED',
        message: error.message || 'Failed to create booking'
      });
    }
  },

  /**
   * Just confirm price without booking
   */
  async confirmPrice(req: Request, res: Response) {
    try {
      const { flightOffer, travelers } = req.body;

      if (!flightOffer) {
        return res.status(400).json({
          error: 'Flight offer is required'
        });
      }

      const priceConfirmation = await amadeusService.confirmFlightPrice(
        [flightOffer],
        travelers
      );

      const confirmedOffer = priceConfirmation.flightOffers?.[0];
      if (!confirmedOffer) {
        return res.status(400).json({
          error: 'Could not confirm price'
        });
      }

      // Calculate price difference
      const originalPrice = parseFloat(flightOffer.price.total);
      const confirmedPrice = parseFloat(confirmedOffer.price.total);
      const priceChanged = Math.abs(originalPrice - confirmedPrice) > 0.01;

      return res.json({
        priceChanged,
        originalPrice,
        confirmedPrice,
        priceDifference: confirmedPrice - originalPrice,
        confirmedOffer,
        fareRules: priceConfirmation.flightOffers?.[0]?.fareDetailsBySegment,
        includedBags: priceConfirmation.included?.bags
      });

    } catch (error: any) {
      console.error('Price confirmation error:', error);
      return res.status(500).json({
        error: 'Failed to confirm price',
        message: error.message
      });
    }
  }
};
