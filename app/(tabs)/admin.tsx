import { Gym, User } from '@/entities/all';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../components/Localization';
import SubscriptionGuard from '../../components/SubscriptionGuard';
import UserEditModal from '../../components/UserEditModal';

export default function Admin() {
  const { t, user, isLoading: isAppLoading } = useAppContext();
  const [users, setUsers] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  useEffect(() => {
    if (!isAppLoading && user) {
      loadData();
    }
  }, [user, isAppLoading]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, gymsData] = await Promise.all([
        User.filter({}),
        Gym.filter({})
      ]);
      setUsers(usersData);
      setGyms(gymsData);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonateUser = async (targetUser) => {
    Alert.alert(
      t('admin.impersonate_title'),
      t('admin.impersonate_message', { user: targetUser.email }),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('admin.impersonate'),
          onPress: async () => {
            setIsImpersonating(true);
            try {
              // In a real app, this would make an API call to impersonate the user
              console.log('Impersonating user:', targetUser.email);
              setSelectedUser(targetUser);
            } catch (error) {
              console.error('Failed to impersonate user:', error);
            } finally {
              setIsImpersonating(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      t('admin.delete_user_title'),
      t('admin.delete_user_message'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await User.delete(userId);
              setUsers(prev => prev.filter(u => u.id !== userId));
            } catch (error) {
              console.error('Failed to delete user:', error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteGym = async (gymId) => {
    Alert.alert(
      t('admin.delete_gym_title'),
      t('admin.delete_gym_message'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Gym.delete(gymId);
              setGyms(prev => prev.filter(g => g.id !== gymId));
            } catch (error) {
              console.error('Failed to delete gym:', error);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SubscriptionGuard requiredLevel="admin">
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('admin.title')}</Text>
            <Text style={styles.subtitle}>{t('admin.subtitle')}</Text>
          </View>

          {selectedUser && (
            <View style={styles.impersonationBanner}>
              <Ionicons name="person" size={16} color="#F59E0B" />
              <Text style={styles.impersonationText}>
                {t('admin.impersonating', { user: selectedUser.email })}
              </Text>
              <TouchableOpacity
                style={styles.stopImpersonationButton}
                onPress={() => setSelectedUser(null)}
              >
                <Text style={styles.stopImpersonationButtonText}>
                  {t('admin.stop_impersonating')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('admin.users_management')}</Text>
            <Text style={styles.sectionSubtitle}>{t('admin.users_management_subtitle')}</Text>
            
            <View style={styles.usersList}>
              {users.map(user => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.full_name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userBadges}>
                      <View style={[styles.badge, user.role === 'admin' && styles.adminBadge]}>
                        <Text style={[styles.badgeText, user.role === 'admin' && styles.adminBadgeText]}>
                          {user.role}
                        </Text>
                      </View>
                      {user.gym_id && (
                        <View style={styles.gymBadge}>
                          <Text style={styles.gymBadgeText}>
                            {gyms.find(g => g.id === user.gym_id)?.name || 'Unknown Gym'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setEditingUser(user);
                        setIsUserModalOpen(true);
                      }}
                    >
                      <Ionicons name="create" size={16} color="#60A5FA" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleImpersonateUser(user)}
                      disabled={isImpersonating}
                    >
                      <Ionicons name="person" size={16} color="#60A5FA" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteUser(user.id)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('admin.gyms_management')}</Text>
            <Text style={styles.sectionSubtitle}>{t('admin.gyms_management_subtitle')}</Text>
            
            <View style={styles.gymsList}>
              {gyms.map(gym => (
                <View key={gym.id} style={styles.gymCard}>
                  <View style={styles.gymInfo}>
                    <Text style={styles.gymName}>{gym.name}</Text>
                    <Text style={styles.gymLocation}>{gym.location}</Text>
                    <Text style={styles.gymMembers}>
                      {users.filter(u => u.gym_id === gym.id).length} {t('admin.members')}
                    </Text>
                  </View>
                  <View style={styles.gymActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteGym(gym.id)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('admin.system_stats')}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{users.length}</Text>
                <Text style={styles.statLabel}>{t('admin.total_users')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{gyms.length}</Text>
                <Text style={styles.statLabel}>{t('admin.total_gyms')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {users.filter(u => u.role === 'admin').length}
                </Text>
                <Text style={styles.statLabel}>{t('admin.admin_users')}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <UserEditModal
        visible={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
          loadData(); // Reload data after edit
        }}
        user={editingUser}
        gyms={gyms}
      />
    </SubscriptionGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
  },
  impersonationBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  impersonationText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 14,
    marginLeft: 8,
  },
  stopImpersonationButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  stopImpersonationButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 16,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  badgeText: {
    fontSize: 10,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  adminBadge: {
    backgroundColor: '#DC2626',
  },
  adminBadgeText: {
    color: 'white',
  },
  gymBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  gymBadgeText: {
    fontSize: 10,
    color: '#60A5FA',
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  gymsList: {
    gap: 12,
  },
  gymCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  gymLocation: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  gymMembers: {
    color: '#60A5FA',
    fontSize: 12,
  },
  gymActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
}); 