import React from 'react';
import { Table, Button, Card } from 'react-bootstrap';
import { formatDate } from '../../../utils/formatters';

const ProfileList = ({ profiles, onSelectProfile, onReload }) => {
  if (!profiles || profiles.length === 0) {
    return (
      <Card className="text-center p-4">
        <Card.Body>
          <h5>Chưa có profile giọng nói nào</h5>
          <p className="text-muted">Bạn chưa tạo profile giọng nói nào. Hãy tạo mới để bắt đầu!</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="profile-list">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Profile giọng nói của bạn</h5>
        <Button variant="outline-secondary" size="sm" onClick={onReload}>
          <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
        </Button>
      </div>

      <Table striped hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>Mô tả</th>
            <th>Ngày tạo</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id}>
              <td>{profile.id}</td>
              <td>{profile.name}</td>
              <td>{profile.description || '(Không có mô tả)'}</td>
              <td>{formatDate(profile.created_at)}</td>
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onSelectProfile(profile)}
                >
                  Chi tiết
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ProfileList; 