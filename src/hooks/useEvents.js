import { useState, useEffect } from 'react';
import { getAllEvents, getEventsByDate, createEvent, updateEvent, deleteEvent } from '../db/database';

export default function useEvents(selectedDate) {
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const data = await getAllEvents();
      setAllEvents(data);
    } catch (error) {
      console.error('Error fetching all events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDayEvents = async (date) => {
    setLoading(true);
    try {
      const data = await getEventsByDate(date);
      setEvents(data.sort((a, b) => a.timeFrom.localeCompare(b.timeFrom)));
    } catch (error) {
      console.error('Error fetching day events:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (event) => {
    await createEvent(event);
    await fetchAllEvents();
    if (selectedDate) {
      await fetchDayEvents(selectedDate);
    }
  };

  const editEvent = async (event) => {
    await updateEvent(event);
    await fetchAllEvents();
    if (selectedDate) {
      await fetchDayEvents(selectedDate);
    }
  };

  const removeEvent = async (id) => {
    await deleteEvent(id);
    await fetchAllEvents();
    if (selectedDate) {
      await fetchDayEvents(selectedDate);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDayEvents(selectedDate);
    }
  }, [selectedDate]);

  return {
    events,
    allEvents,
    loading,
    addEvent,
    editEvent,
    removeEvent,
    refresh: fetchAllEvents
  };
}
