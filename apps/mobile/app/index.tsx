import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import * as Location from "expo-location";
import {
  Activity,
  ActivityCategory,
  SearchFilters,
  UserLocation,
  ACTIVITY_CATEGORIES,
  DEFAULT_RADIUS_METERS,
} from "@kids-app/shared";

const WEB_API_URL = "http://localhost:3000"; // Change to your deployed URL

export default function HomeScreen() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    radiusMeters: DEFAULT_RADIUS_METERS,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  useEffect(() => {
    if (!location) return;
    fetchActivities();
  }, [location, filters]);

  const fetchActivities = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        radius: String(filters.radiusMeters),
        ...(filters.category && { category: filters.category }),
      });
      const res = await fetch(`${WEB_API_URL}/api/activities?${params}`);
      const data = await res.json();
      setActivities(data.activities ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (value: ActivityCategory) => {
    setFilters((f) => ({
      ...f,
      category: f.category === value ? undefined : value,
    }));
  };

  return (
    <View style={styles.container}>
      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {ACTIVITY_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            onPress={() => toggleCategory(cat.value as ActivityCategory)}
            style={[
              styles.chip,
              filters.category === cat.value && styles.chipActive,
            ]}
          >
            <Text style={styles.chipEmoji}>{cat.emoji}</Text>
            <Text
              style={[
                styles.chipLabel,
                filters.category === cat.value && styles.chipLabelActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {!location ? (
        <View style={styles.center}>
          <Text style={styles.hint}>Getting your location...</Text>
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ActivityItem activity={item} />}
          ListEmptyComponent={
            <Text style={styles.hint}>No activities found nearby.</Text>
          }
        />
      )}
    </View>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <View style={styles.card}>
      {activity.photoUrl && (
        <Image source={{ uri: activity.photoUrl }} style={styles.photo} />
      )}
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={1}>
          {activity.name}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {activity.address}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.categoryBadge}>{activity.category}</Text>
          {activity.rating && (
            <Text style={styles.rating}>⭐ {activity.rating.toFixed(1)}</Text>
          )}
          {activity.openNow !== undefined && (
            <Text style={activity.openNow ? styles.open : styles.closed}>
              {activity.openNow ? "Open" : "Closed"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  filterRow: { flexGrow: 0, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  chipActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: "500", color: "#374151" },
  chipLabelActive: { color: "#fff" },
  list: { padding: 12, gap: 10 },
  card: { backgroundColor: "#fff", borderRadius: 16, flexDirection: "row", overflow: "hidden", borderWidth: 1, borderColor: "#f3f4f6" },
  photo: { width: 80, height: 80 },
  cardBody: { flex: 1, padding: 12, justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "600", color: "#111827" },
  address: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  categoryBadge: { fontSize: 11, backgroundColor: "#f3f4f6", color: "#374151", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rating: { fontSize: 12, color: "#6b7280" },
  open: { fontSize: 11, color: "#16a34a", fontWeight: "600" },
  closed: { fontSize: 11, color: "#dc2626", fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  hint: { color: "#9ca3af", fontSize: 14 },
});
