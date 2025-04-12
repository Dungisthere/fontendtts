import React, { useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';

const CreateProfile = ({ onCreateProfile, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validated, setValidated] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    onCreateProfile({
      name: name.trim(),
      description: description.trim()
    });
  };

  return (
    <div className="create-profile">
      <h5 className="mb-3">Tạo profile giọng nói mới</h5>
      <Card className="p-3">
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="profileName">
            <Form.Label>Tên profile</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập tên profile (ví dụ: Giọng chính của tôi)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
            />
            <Form.Control.Feedback type="invalid">
              Vui lòng nhập tên profile
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Đặt tên dễ nhớ để dễ dàng nhận biết profile của bạn.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="profileDescription">
            <Form.Label>Mô tả (tùy chọn)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Nhập mô tả cho profile này"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
            <Form.Text className="text-muted">
              Mô tả ngắn gọn về profile này (tối đa 200 ký tự).
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Tạo mới
            </Button>
          </div>
        </Form>
      </Card>
      
      <div className="mt-4">
        <h6>Hướng dẫn sử dụng Voice Library:</h6>
        <ol className="small text-muted">
          <li>Tạo một profile giọng nói mới.</li>
          <li>Thêm từ vựng bằng cách ghi âm giọng của bạn cho từng từ.</li>
          <li>Sử dụng tính năng Text to Speech để chuyển văn bản thành giọng nói.</li>
          <li>Hệ thống sẽ tự động nối các từ đã ghi âm để tạo ra đoạn âm thanh mượt mà.</li>
        </ol>
      </div>
    </div>
  );
};

export default CreateProfile; 