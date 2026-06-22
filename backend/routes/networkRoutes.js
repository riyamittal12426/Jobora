import express from 'express';
import Contact from '../models/Contact.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

// Get all contacts for a user
router.get('/:email', verifyFirebaseToken, async (req, res) => {
  try {
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const contacts = await Contact.find({ userEmail: req.params.email }).sort({ updatedAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new contact
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { userEmail } = req.body;
    if (req.user.email !== userEmail) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const newContact = new Contact(req.body);
    const savedContact = await newContact.save();
    res.status(201).json(savedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a contact
router.put('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const contactId = req.params.id;
    const updatedContact = await Contact.findByIdAndUpdate(
      contactId,
      { $set: req.body },
      { new: true }
    );
    if (!updatedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(updatedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a contact
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const contactId = req.params.id;
    const deletedContact = await Contact.findByIdAndDelete(contactId);
    if (!deletedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
