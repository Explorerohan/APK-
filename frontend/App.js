import { registerTranslation, en } from 'react-native-paper-dates';
// Register English locale for react-native-paper-dates
registerTranslation('en', en);
import React, { useState, useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Switch, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import axios from 'axios';

const API_URL = 'http://192.168.254.3:8000/api/todos/'; 

const QUOTES = [
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
  },
  {
    text: "Success is not the key to happiness. Happiness is the key to success.",
    author: "Albert Schweitzer",
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
];

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

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTodo, setEditTodo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editTime, setEditTime] = useState(new Date());
  const [editDatePickerVisible, setEditDatePickerVisible] = useState(false);
  const [editTimePickerVisible, setEditTimePickerVisible] = useState(false);
  const [editPriority, setEditPriority] = useState('Medium');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [page, setPage] = useState('main'); // 'main', 'completed', 'pending'
  const [quote, setQuote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

// ...existing code...

  // ...existing code...

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
    if (!title.trim() || !description.trim() || !date || !time || !priority.trim()) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      // Format date and time as strings
      const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : '';
      const timeStr = time instanceof Date ? time.toTimeString().slice(0, 8) : '';
      const response = await axios.post(API_URL, {
        title,
        description,
        date: dateStr,
        time: timeStr,
        priority,
        // completed is not sent, defaults to false in backend
      });
      setTodos([response.data, ...todos]);
      setTitle('');
      setDescription('');
      setDate(new Date());
      setTime(new Date());
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
    setEditDate(todo.date ? new Date(todo.date + 'T00:00:00') : null);
    setEditTime(todo.time ? new Date('1970-01-01T' + todo.time) : null);
    setEditPriority(todo.priority);
    setEditModalVisible(true);
  };

  const handleEditTodo = async () => {
    if (!editTitle.trim() || !editDescription.trim() || !editDate || !editTime || !editPriority.trim()) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    setEditSubmitting(true);
    try {
      const dateStr = editDate instanceof Date ? editDate.toISOString().slice(0, 10) : '';
      const timeStr = editTime instanceof Date ? editTime.toTimeString().slice(0, 8) : '';
      const response = await axios.put(`${API_URL}${editTodo.id}/`, {
        title: editTitle,
        description: editDescription,
        date: dateStr,
        time: timeStr,
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

  const handleCompleteTodo = async (id) => {
    try {
      await axios.patch(`${API_URL}${id}/`, { completed: true });
      await fetchTodos();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as completed');
    }
  };

  const renderItem = ({ item }) => {
    const isCompleted = item.completed;
    return (
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
            {!isCompleted && (
              <TouchableOpacity
                style={{ backgroundColor: '#F4F6FB', borderRadius: 8, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: '#E3E6EA', width: 38, alignItems: 'center' }}
                onPress={() => openEditModal(item)}
              >
                <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 17 }}>✏️</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{ backgroundColor: '#FFF0F0', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#FFD1D1', width: 38, alignItems: 'center' }}
              onPress={() => handleDeleteTodo(item.id)}
            >
              <Text style={{ color: '#FF3B30', fontWeight: 'bold', fontSize: 17 }}>🗑️</Text>
            </TouchableOpacity>
            {!isCompleted && (
              <TouchableOpacity
                style={{ backgroundColor: '#E6F9ED', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#B7F0C0', width: 38, alignItems: 'center', marginTop: 6 }}
                onPress={() => handleCompleteTodo(item.id)}
              >
                <Text style={{ color: '#34C759', fontWeight: 'bold', fontSize: 17 }}>✔️</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderFilteredList = (filterCompleted) => {
    const filtered = todos.filter(todo => todo.completed === filterCompleted);
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.headerRow}> 
          <TouchableOpacity
            style={styles.backArrowOnly}
            onPress={() => setPage('main')}
            activeOpacity={0.7}
            accessibilityLabel="Back to Main"
          >
            <Text style={styles.backArrowIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginRight: 40 }}>
            <Text style={styles.headerTitle}>
              {filterCompleted ? 'Completed Tasks' : 'Pending Tasks'}
            </Text>
          </View>
        </View>
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
    <PaperProvider>
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
              <TouchableOpacity
                style={[styles.input, { justifyContent: 'center' }]}
                onPress={() => setDatePickerVisible(true)}
                disabled={submitting}
              >
                <Text style={{ color: date ? '#222' : '#aaa' }}>
                  {date ? date.toLocaleDateString() : 'Select Date'}
                </Text>
              </TouchableOpacity>
              <DatePickerModal
                locale="en"
                mode="single"
                visible={datePickerVisible}
                date={date}
                onConfirm={({ date: d }) => {
                  setDatePickerVisible(false);
                  if (d) setDate(d);
                }}
                onDismiss={() => setDatePickerVisible(false)}
              />
              <TouchableOpacity
                style={[styles.input, { justifyContent: 'center' }]}
                onPress={() => setTimePickerVisible(true)}
                disabled={submitting}
              >
                <Text style={{ color: time ? '#222' : '#aaa' }}>
                  {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                </Text>
              </TouchableOpacity>
              <TimePickerModal
                visible={timePickerVisible}
                onConfirm={({ hours, minutes }) => {
                  setTimePickerVisible(false);
                  if (typeof hours === 'number' && typeof minutes === 'number') {
                    const newTime = new Date(date);
                    newTime.setHours(hours);
                    newTime.setMinutes(minutes);
                    newTime.setSeconds(0);
                    setTime(newTime);
                  }
                }}
                onDismiss={() => setTimePickerVisible(false)}
                hours={time.getHours()}
                minutes={time.getMinutes()}
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
              <TouchableOpacity
                style={[styles.input, { justifyContent: 'center' }]}
                onPress={() => setEditDatePickerVisible(true)}
                disabled={editSubmitting}
              >
                <Text style={{ color: editDate ? '#222' : '#aaa' }}>
                  {editDate ? editDate.toLocaleDateString() : 'Select Date'}
                </Text>
              </TouchableOpacity>
              <DatePickerModal
                locale="en"
                mode="single"
                visible={editDatePickerVisible}
                date={editDate}
                onConfirm={({ date: d }) => {
                  setEditDatePickerVisible(false);
                  if (d) setEditDate(d);
                }}
                onDismiss={() => setEditDatePickerVisible(false)}
              />
              <TouchableOpacity
                style={[styles.input, { justifyContent: 'center' }]}
                onPress={() => setEditTimePickerVisible(true)}
                disabled={editSubmitting}
              >
                <Text style={{ color: editTime ? '#222' : '#aaa' }}>
                  {editTime ? editTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                </Text>
              </TouchableOpacity>
              <TimePickerModal
                visible={editTimePickerVisible}
                onConfirm={({ hours, minutes }) => {
                  setEditTimePickerVisible(false);
                  if (typeof hours === 'number' && typeof minutes === 'number') {
                    const newTime = new Date(editDate);
                    newTime.setHours(hours);
                    newTime.setMinutes(minutes);
                    newTime.setSeconds(0);
                    setEditTime(newTime);
                  }
                }}
                onDismiss={() => setEditTimePickerVisible(false)}
                hours={editTime.getHours()}
                minutes={editTime.getMinutes()}
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
  </PaperProvider>
  );
}

const styles = StyleSheet.create({
  backArrowOnly: {
    marginTop: 0,
    marginBottom: 0,
    alignSelf: 'flex-start',
    padding: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'transparent',
    elevation: 0,
  },
  backArrowIcon: {
    color: '#007AFF',
    fontSize: 36,
    fontWeight: '600',
    lineHeight: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
    alignSelf: 'center',
    marginTop: 32,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#222',
  },
});
