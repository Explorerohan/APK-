// Helper to calculate time left until due date/time
function getTimeLeft(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  const due = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  const diff = due - now;
  if (isNaN(due.getTime()) || diff <= 0) return 'Overdue';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Switch, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import axios from 'axios';

const API_URL = 'http://192.168.254.3:8000/api/todos/'; 

const QUOTES = [
  {
    text: 'The best way to predict the future is to create it.',
    author: 'Peter Drucker',
  },
  {
    text: 'Success is not the key to happiness. Happiness is the key to success.',
    author: 'Albert Schweitzer',
  },
  {
    text: 'Don’t watch the clock; do what it does. Keep going.',
    author: 'Sam Levenson',
  },
  {
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
  },
  {
    text: 'Believe you can and you’re halfway there.',
    author: 'Theodore Roosevelt',
  },
];

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTodo, setEditTodo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [page, setPage] = useState('main'); // 'main', 'completed', 'pending'
  const [quote, setQuote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setTodos(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch todos');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async () => {
    if (!title.trim() || !description.trim() || !date.trim() || !time.trim() || !priority.trim()) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await axios.post(API_URL, {
        title,
        description,
        date,
        time,
        priority,
        // completed is not sent, defaults to false in backend
      });
      setTodos([response.data, ...todos]);
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setPriority('Medium');
    } catch (error) {
      Alert.alert('Error', 'Failed to add todo');
    }
    setSubmitting(false);
  };

  const handleDeleteTodo = async (id) => {
    try {
      await axios.delete(`${API_URL}${id}/`);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete todo');
    }
  };

  const openEditModal = (todo) => {
    setEditTodo(todo);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setEditDate(todo.date);
    setEditTime(todo.time);
    setEditPriority(todo.priority);
    setEditModalVisible(true);
  };

  const handleEditTodo = async () => {
    if (!editTitle.trim() || !editDescription.trim() || !editDate.trim() || !editTime.trim() || !editPriority.trim()) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    setEditSubmitting(true);
    try {
      const response = await axios.put(`${API_URL}${editTodo.id}/`, {
        title: editTitle,
        description: editDescription,
        date: editDate,
        time: editTime,
        priority: editPriority,
      });
      await fetchTodos();
      setEditModalVisible(false);
      setEditTodo(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update todo');
    }
    setEditSubmitting(false);
  };

  // For dynamic due time updates
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const renderItem = ({ item }) => (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 18,
      padding: 20,
      marginBottom: 18,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
      borderLeftWidth: 5,
      borderLeftColor:
        item.priority === 'High' ? '#FF3B30' :
        item.priority === 'Medium' ? '#007AFF' :
        '#34C759',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 10, letterSpacing: 0.2 }} numberOfLines={1}>{item.title}</Text>
          <Text style={{ fontSize: 15, color: '#666', marginBottom: 10, lineHeight: 20 }}>{item.description}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: '#007AFF', fontSize: 13, marginRight: 16 }}>📅 {item.date}</Text>
            <Text style={{ color: '#007AFF', fontSize: 13 }}>⏰ {item.time}</Text>
          </View>
          <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: 'bold', marginBottom: 10 }}>Due: {getTimeLeft(item.date, item.time)}</Text>
          <View style={{ height: 8 }} />
        </View>
        <View style={{ flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', gap: 8 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#F4F6FB', borderRadius: 8, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: '#E3E6EA', width: 38, alignItems: 'center' }}
            onPress={() => openEditModal(item)}
          >
            <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 17 }}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#FFF0F0', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#FFD1D1', width: 38, alignItems: 'center' }}
            onPress={() => handleDeleteTodo(item.id)}
          >
            <Text style={{ color: '#FF3B30', fontWeight: 'bold', fontSize: 17 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderFilteredList = (filterCompleted) => {
    const filtered = todos.filter(todo => todo.completed === filterCompleted);
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={{ marginTop: 20, marginBottom: 10 }} onPress={() => setPage('main')}>
          <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>{'< Back to Main'}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10, alignSelf: 'center' }}>
          {filterCompleted ? 'Completed Tasks' : 'Pending Tasks'}
        </Text>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>
            {filterCompleted ? 'No completed tasks.' : 'No pending tasks.'}
          </Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id?.toString() || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {page === 'main' && <>
          <Text style={styles.header}>TODO List</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              editable={!submitting}
            />
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!submitting}
            />
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={date}
              onChangeText={setDate}
              editable={!submitting}
            />
            <TextInput
              style={styles.input}
              placeholder="Time (HH:MM:SS)"
              value={time}
              onChangeText={setTime}
              editable={!submitting}
            />
            <View style={styles.input}>
              <Text style={{ marginBottom: 4 }}>Priority:</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {['High', 'Medium', 'Low'].map(opt => {
                  let bgColor = '#f1f3f6';
                  if (priority === opt) {
                    if (opt === 'High') bgColor = '#FF3B30';
                    else if (opt === 'Medium') bgColor = '#007AFF';
                    else if (opt === 'Low') bgColor = '#34C759';
                  }
                  let textColor = priority === opt ? '#fff' : '#222';
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={{
                        backgroundColor: bgColor,
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                      }}
                      onPress={() => setPriority(opt)}
                      disabled={submitting}
                    >
                      <Text style={{ color: textColor, fontWeight: 'bold' }}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddTodo}
              disabled={submitting}
            >
              <Text style={styles.addButtonText}>{submitting ? 'Adding...' : 'Add Todo'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <TouchableOpacity style={[styles.addButton, { flex: 1, marginRight: 8, backgroundColor: '#34C759' }]} onPress={() => setPage('completed')}>
              <Text style={styles.addButtonText}>Completed Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addButton, { flex: 1, marginLeft: 8, backgroundColor: '#FF9500' }]} onPress={() => setPage('pending')}>
              <Text style={styles.addButtonText}>Pending Tasks</Text>
            </TouchableOpacity>
          </View>
          {/* No tasks are shown on the main page. Pending and completed tasks are shown only in their dedicated sections. */}
        </>}
        {page === 'main' && (
          <View style={{ alignItems: 'center', marginTop: 30, marginBottom: 10 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>💡</Text>
            <Text style={{ fontStyle: 'italic', color: '#007AFF', fontSize: 17, textAlign: 'center', marginHorizontal: 10 }}>
              "{quote.text}"
            </Text>
            <Text style={{ color: '#888', fontSize: 15, marginTop: 4, textAlign: 'center', marginBottom: 6 }}>- {quote.author}</Text>
            {/* No button to change quote, quote is fixed per app load */}
          </View>
        )}
        {page === 'completed' && renderFilteredList(true)}
        {page === 'pending' && renderFilteredList(false)}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Edit Todo</Text>
              <TextInput
                style={styles.input}
                placeholder="Title"
                value={editTitle}
                onChangeText={setEditTitle}
                editable={!editSubmitting}
              />
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Description"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                editable={!editSubmitting}
              />
              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                value={editDate}
                onChangeText={setEditDate}
                editable={!editSubmitting}
              />
              <TextInput
                style={styles.input}
                placeholder="Time (HH:MM:SS)"
                value={editTime}
                onChangeText={setEditTime}
                editable={!editSubmitting}
              />
              <View style={styles.input}>
                <Text style={{ marginBottom: 4 }}>Priority:</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {['High', 'Medium', 'Low'].map(opt => {
                  let bgColor = '#f1f3f6';
                  if (editPriority === opt) {
                    if (opt === 'High') bgColor = '#FF3B30';
                    else if (opt === 'Medium') bgColor = '#007AFF';
                    else if (opt === 'Low') bgColor = '#34C759';
                  }
                  let textColor = editPriority === opt ? '#fff' : '#222';
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={{
                        backgroundColor: bgColor,
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                      }}
                      onPress={() => setEditPriority(opt)}
                      disabled={editSubmitting}
                    >
                      <Text style={{ color: textColor, fontWeight: 'bold' }}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
                </View>
              </View>
              <View style={[styles.modalActions, { paddingRight: 10 }]}> 
                <TouchableOpacity
                  style={[styles.addButton, { minWidth: 90 }]}
                  onPress={handleEditTodo}
                  disabled={editSubmitting}
                >
                  <Text style={styles.addButtonText}>{editSubmitting ? 'Updating...' : 'Update'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: '#aaa', marginLeft: 12, minWidth: 90 }]}
                  onPress={() => setEditModalVisible(false)}
                  disabled={editSubmitting}
                >
                  <Text style={styles.addButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <StatusBar style="dark" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
    alignSelf: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  input: {
    backgroundColor: '#f1f3f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e3e6ea',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    marginTop: 10,
  },
  todoItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  todoContent: {
    flex: 1,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: '#34C759',
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  todoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteBtn: {
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  modalHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    alignSelf: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 16,
    marginTop: 40,
  },
});
