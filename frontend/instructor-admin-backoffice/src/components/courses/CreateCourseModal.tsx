import React, { useState } from 'react';
import Modal from 'react-modal';

interface CreateCourseModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onCreateCourse: (courseName: string) => void;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ isOpen, onRequestClose, onCreateCourse }) => {
  const [courseName, setCourseName] = useState('');

  const handleCreateCourse = () => {
    if (courseName.trim()) {
      onCreateCourse(courseName);
      setCourseName('');
      onRequestClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Create Course">
      <h2>Create New Course</h2>
      <input
        type="text"
        value={courseName}
        onChange={(e) => setCourseName(e.target.value)}
        placeholder="Enter course name"
      />
      <button onClick={handleCreateCourse}>Create Course</button>
      <button onClick={onRequestClose}>Cancel</button>
    </Modal>
  );
};

export default CreateCourseModal;