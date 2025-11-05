import React from "react";
import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import { Card } from "../../components/ui";
import api from "../../api/client";
import {
  Users,
  Search,
  Filter,
  Loader2,
  Mail,
  Building2,
  User as UserIcon,
  Shield,
  Calendar,
  Phone,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function ManageUser() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(20);

  useEffect(() => {
    loadInstitutions();
  }, []);

  useEffect(() => {
    if (institutions.length > 0) {
      loadUsers();
    }
  }, [selectedInstitutionId, searchQuery, statusFilter, roleFilter, currentPage]);

  const loadInstitutions = async () => {
    try {
      const response = await api.institutions.getMyInstitutions();
      const fetchedInstitutions = response.data.institutions || [];
      setInstitutions(fetchedInstitutions);

      if (fetchedInstitutions.length === 0) {
        addToast("You are not an admin of any institution", "error");
        setLoading(false);
      }
    } catch (error) {
      addToast(
        error.message || "Failed to load institutions",
        "error"
      );
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      let allUsers = [];
      let totalCount = 0;

      // If "all" is selected, fetch from each institution and combine
      if (selectedInstitutionId === "all") {
        const fetchPromises = institutions.map(async (inst) => {
          const params = {
            page: 1,
            limit: 1000, // Large limit to get all users from each institution
            institutionId: inst._id,
          };

          if (searchQuery) {
            params.search = searchQuery;
          }

          if (statusFilter !== "all") {
            params.status = statusFilter;
          }

          if (roleFilter !== "all") {
            params.role = roleFilter;
          }

          const response = await api.admin.getUsers(params);
          return response.data.users || [];
        });

        const results = await Promise.all(fetchPromises);
        allUsers = results.flat();
        
        // Remove duplicates based on user ID
        const uniqueUsers = Array.from(
          new Map(allUsers.map((user) => [user._id, user])).values()
        );
        
        totalCount = uniqueUsers.length;

        // Apply pagination manually
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        allUsers = uniqueUsers.slice(startIndex, endIndex);
        setTotalPages(Math.ceil(totalCount / pageSize));
      } else {
        // Single institution - use backend pagination
        const params = {
          page: currentPage,
          limit: pageSize,
          institutionId: selectedInstitutionId,
        };

        if (searchQuery) {
          params.search = searchQuery;
        }

        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        if (roleFilter !== "all") {
          params.role = roleFilter;
        }

        const response = await api.admin.getUsers(params);
        allUsers = response.data.users || [];
        setTotalPages(response.data.totalPages || 1);
        totalCount = response.data.totalUsers || 0;
      }

      setUsers(allUsers);
      setTotalUsers(totalCount);
    } catch (error) {
      addToast(
        error.message || "Failed to load users",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleInstitutionChange = (e) => {
    setSelectedInstitutionId(e.target.value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: (
        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
          <CheckCircle size={12} />
          Active
        </span>
      ),
      pending: (
        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
          <AlertCircle size={12} />
          Pending
        </span>
      ),
      suspended: (
        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
          <XCircle size={12} />
          Suspended
        </span>
      ),
      deleted: (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
          <XCircle size={12} />
          Deleted
        </span>
      ),
    };
    return badges[status] || (
      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      superadmin: "bg-purple-100 text-purple-700",
      admin: "bg-blue-100 text-blue-700",
      user: "bg-gray-100 text-gray-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors[role] || colors.user}`}
      >
        {role}
      </span>
    );
  };

  if (loading && institutions.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-emerald-600" size={48} />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (institutions.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <div className="text-center py-12">
            <Users className="mx-auto mb-4 text-gray-300" size={64} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Institutions Found
            </h2>
            <p className="text-gray-600">
              You are not an admin of any institution.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-gray-600 mt-2">
          View and manage users from your institution(s)
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Institution Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institution
            </label>
            <select
              value={selectedInstitutionId}
              onChange={handleInstitutionChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Institutions</option>
              {institutions.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Users Count */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{users.length}</span> of{" "}
            <span className="font-semibold">{totalUsers}</span> users
          </p>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <Card>
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto mb-4 text-emerald-600" size={48} />
            <p className="text-gray-600">Loading users...</p>
          </div>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="mx-auto mb-4 text-gray-300" size={64} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Users Found
            </h2>
            <p className="text-gray-600">
              No users found matching your criteria.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      Contact
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      Institution
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      Joined
                    </th>
                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <UserIcon
                              className="text-emerald-600"
                              size={20}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name}
                            </p>
                            {user.enrollmentId && (
                              <p className="text-sm text-gray-500">
                                ID: {user.enrollmentId}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-gray-700">{user.email}</span>
                          </div>
                          {user.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone size={14} className="text-gray-400" />
                              <span className="text-gray-700">
                                {user.phoneNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {user.institutionId ? (
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.institutionId.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user.institutionId.code}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No Institution
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-700 capitalize">
                          {user.userType || "N/A"}
                        </span>
                        {user.department && (
                          <p className="text-xs text-gray-500">
                            {user.department}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>
                            {format(new Date(user.createdAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
