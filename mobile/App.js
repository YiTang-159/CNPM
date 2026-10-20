import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('Tiếng Anh');
  const [loading, setLoading] = useState(false);

  const handleSelectVideo = () => {
    Alert.alert('Chọn Video', 'Đã mở thư viện để chọn video thuyết minh!');
  };

  const handleStartDubbing = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Thành công', 'Đã thuyết minh tự động xong!');
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dubchef</Text>
        <Text style={styles.subtitle}>Thuyết minh tự động đa ngôn ngữ</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Khung chọn Video */}
        <TouchableOpacity style={styles.uploadCard} onPress={handleSelectVideo}>
          <Text style={styles.uploadIcon}>🎬</Text>
          <Text style={styles.uploadText}>Nhấn để tải lên Video</Text>
          <Text style={styles.uploadSubtext}>Hỗ trợ MP4, MOV (Tối đa 50MB)</Text>
        </TouchableOpacity>

        {/* Khung chọn Ngôn ngữ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn ngôn ngữ thuyết minh:</Text>
          <View style={styles.langContainer}>
            {['Tiếng Anh', 'Tiếng Nhật', 'Tiếng Hàn', 'Tiếng Trung'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langBadge,
                  selectedLanguage === lang && styles.activeLangBadge
                ]}
                onPress={() => setSelectedLanguage(lang)}
              >
                <Text
                  style={[
                    styles.langText,
                    selectedLanguage === lang && styles.activeLangText
                  ]}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nút bấm Dịch & Thuyết minh */}
        <TouchableOpacity 
          style={styles.dubButton} 
          onPress={handleStartDubbing}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.dubButtonText}>Bắt đầu Thuyết minh ({selectedLanguage})</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#007aff',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  uploadCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#007aff',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  langContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  langBadge: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  activeLangBadge: {
    backgroundColor: '#007aff',
  },
  langText: {
    fontSize: 14,
    color: '#495057',
  },
  activeLangText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dubButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  dubButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});